#!/usr/bin/env python3
"""Create any missing HTTP API routes/integrations on the live Aletheia API.

CloudFormation can report UPDATE_COMPLETE while API Gateway $default has no
routes (stage RouteSettings 404 + rollback). This heals that drift in place
so the existing execute-api URL keeps working.
"""

from __future__ import annotations

import json
import subprocess
import sys
import urllib.error
import urllib.request

REGION = "us-east-1"
API_NAME = "spendings-categorizer-api"
FALLBACK_API_ID = "9kb7anm4rl"

ROUTES: list[tuple[str, str]] = [
    ("POST /auth/google", "spendings-categorizer-auth"),
    ("POST /auth/apple", "spendings-categorizer-auth"),
    ("POST /auth/email", "spendings-categorizer-auth"),
    ("POST /auth/logout", "spendings-categorizer-auth"),
    ("GET /auth/me", "spendings-categorizer-auth"),
    ("DELETE /auth/me", "spendings-categorizer-auth"),
    ("GET /statements", "spendings-categorizer-statements"),
    ("POST /statements", "spendings-categorizer-statements"),
    ("GET /statements/{id}", "spendings-categorizer-statements"),
    ("DELETE /statements/{id}", "spendings-categorizer-statements"),
    ("POST /statements/{id}/assign-account", "spendings-categorizer-statements"),
    ("POST /families", "spendings-categorizer-families"),
    ("PUT /families", "spendings-categorizer-families"),
    ("DELETE /families", "spendings-categorizer-families"),
    ("GET /families/mine", "spendings-categorizer-families"),
    ("POST /families/members", "spendings-categorizer-families"),
    ("DELETE /families/members/{email}", "spendings-categorizer-families"),
    ("PUT /families/members/{email}", "spendings-categorizer-families"),
    ("GET /categories", "spendings-categorizer-categories"),
    ("PUT /categories", "spendings-categorizer-categories"),
    ("POST /categories/recategorize", "spendings-categorizer-categories"),
    ("POST /categories/rename", "spendings-categorizer-categories"),
    ("POST /categories/ignore", "spendings-categorizer-categories"),
    ("POST /categories/hide", "spendings-categorizer-categories"),
    ("POST /categories/apply", "spendings-categorizer-categories"),
    ("GET /accounts", "spendings-categorizer-accounts"),
    ("POST /accounts", "spendings-categorizer-accounts"),
    ("PUT /accounts/{id}", "spendings-categorizer-accounts"),
    ("DELETE /accounts/{id}", "spendings-categorizer-accounts"),
    ("POST /devices", "spendings-categorizer-devices"),
    ("DELETE /devices/{token}", "spendings-categorizer-devices"),
    ("GET /reminders", "spendings-categorizer-reminders"),
    ("POST /reminders", "spendings-categorizer-reminders"),
    ("PUT /reminders/settings", "spendings-categorizer-reminders"),
    ("PUT /reminders/{id}", "spendings-categorizer-reminders"),
    ("DELETE /reminders/{id}", "spendings-categorizer-reminders"),
    ("PUT /reminders/{id}/paid", "spendings-categorizer-reminders"),
    ("POST /pierre/sync", "spendings-categorizer-pierre"),
]


def aws_run(args: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["aws", *args, "--region", REGION, "--output", "json"],
        check=check,
        capture_output=True,
        text=True,
    )


def aws_json(args: list[str]) -> dict | list | None:
    result = aws_run(args)
    text = result.stdout.strip()
    if not text:
        return None
    return json.loads(text)


def aws_ignore_exists(args: list[str], already_exists: tuple[str, ...] = ("already exists", "ResourceConflictException", "ConflictException")) -> dict | None:
    result = aws_run(args, check=False)
    combined = f"{result.stdout}\n{result.stderr}"
    if result.returncode == 0:
        text = result.stdout.strip()
        return json.loads(text) if text else None
    if any(token.lower() in combined.lower() for token in already_exists):
        return None
    raise SystemExit(combined.strip() or f"aws {' '.join(args)} failed")


def paginate(command: list[str], key: str) -> list[dict]:
    items: list[dict] = []
    token: str | None = None
    while True:
        args = list(command)
        if token:
            args.extend(["--next-token", token])
        payload = aws_json(args) or {}
        if not isinstance(payload, dict):
            break
        items.extend(payload.get(key) or [])
        token = payload.get("NextToken")
        if not token:
            break
    return items


def find_api_id() -> str:
    items = paginate(["apigatewayv2", "get-apis"], "Items")
    matches = [item["ApiId"] for item in items if item.get("Name") == API_NAME]
    if FALLBACK_API_ID in matches:
        return FALLBACK_API_ID
    if matches:
        return matches[0]
    if any(item.get("ApiId") == FALLBACK_API_ID for item in items):
        return FALLBACK_API_ID
    raise SystemExit(f"HTTP API {API_NAME!r} not found")


def lambda_arn(function_name: str) -> str:
    cfg = aws_json(["lambda", "get-function-configuration", "--function-name", function_name])
    if not isinstance(cfg, dict) or not cfg.get("FunctionArn"):
        raise SystemExit(f"Lambda {function_name} not found")
    return str(cfg["FunctionArn"])


def integration_for(fn: str, integrations: list[dict]) -> str | None:
    for item in integrations:
        uri = str(item.get("IntegrationUri") or "")
        if fn in uri:
            return str(item["IntegrationId"])
    return None


def ensure_integration(api_id: str, fn: str, cache: dict[str, str], integrations: list[dict]) -> str:
    if fn in cache:
        return cache[fn]
    existing = integration_for(fn, integrations)
    if existing:
        cache[fn] = existing
        return existing
    created = aws_json(
        [
            "apigatewayv2",
            "create-integration",
            "--api-id",
            api_id,
            "--integration-type",
            "AWS_PROXY",
            "--integration-uri",
            lambda_arn(fn),
            "--payload-format-version",
            "2.0",
        ]
    )
    if not isinstance(created, dict):
        raise SystemExit(f"failed to create integration for {fn}")
    cache[fn] = str(created["IntegrationId"])
    integrations.append(created)
    print(f"created integration {cache[fn]} -> {fn}")
    return cache[fn]


def ensure_invoke_permission(api_id: str, fn: str, account: str) -> None:
    source = f"arn:aws:execute-api:{REGION}:{account}:{api_id}/*/*"
    aws_ignore_exists(
        [
            "lambda",
            "add-permission",
            "--function-name",
            fn,
            "--statement-id",
            "HttpApiInvokeAll",
            "--action",
            "lambda:InvokeFunction",
            "--principal",
            "apigateway.amazonaws.com",
            "--source-arn",
            source,
        ]
    )


def http_status(url: str, method: str, body: bytes | None = None) -> tuple[int, str]:
    req = urllib.request.Request(
        url,
        data=body,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, resp.read().decode()[:200]
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode()[:200]


def main() -> int:
    api_id = find_api_id()
    print(f"api_id={api_id}")

    existing_routes = {
        str(item["RouteKey"])
        for item in paginate(["apigatewayv2", "get-routes", "--api-id", api_id], "Items")
    }
    print(f"existing_routes={len(existing_routes)}")

    integrations = paginate(["apigatewayv2", "get-integrations", "--api-id", api_id], "Items")
    cache: dict[str, str] = {}

    auth_arn = lambda_arn("spendings-categorizer-auth")
    account = auth_arn.split(":")[4]
    for fn in sorted({name for _, name in ROUTES}):
        ensure_invoke_permission(api_id, fn, account)

    created = 0
    for route_key, fn in ROUTES:
        if route_key in existing_routes:
            continue
        integration_id = ensure_integration(api_id, fn, cache, integrations)
        aws_ignore_exists(
            [
                "apigatewayv2",
                "create-route",
                "--api-id",
                api_id,
                "--route-key",
                route_key,
                "--target",
                f"integrations/{integration_id}",
            ]
        )
        created += 1
        print(f"created {route_key}")

    aws_run(
        [
            "apigatewayv2",
            "update-stage",
            "--api-id",
            api_id,
            "--stage-name",
            "$default",
            "--auto-deploy",
        ]
    )
    cors = json.dumps(
        {
            "AllowOrigins": [
                "https://lucasdelevy.github.io",
                "http://localhost:5173",
            ],
            "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "AllowHeaders": ["Content-Type", "Authorization"],
            "MaxAge": 86400,
        }
    )
    aws_run(
        [
            "apigatewayv2",
            "update-api",
            "--api-id",
            api_id,
            "--cors-configuration",
            cors,
        ]
    )
    print(f"created_routes={created}")

    base = f"https://{api_id}.execute-api.{REGION}.amazonaws.com"
    failed = False
    for method, path, body in (
        ("POST", "/auth/google", b"{}"),
        ("POST", "/auth/apple", b"{}"),
        ("POST", "/auth/email", b"{}"),
        ("GET", "/auth/me", None),
    ):
        status, body_text = http_status(base + path, method, body)
        print(f"smoke {method} {path} -> {status} {body_text}")
        if status == 404:
            failed = True
    if failed:
        print("auth routes still returning 404", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
