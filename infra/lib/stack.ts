import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import type { Construct } from "constructs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class SpendingsCategorizerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "Table", {
      tableName: "spendings-categorizer",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "expiresAt",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const backendDist = path.join(__dirname, "../../backend/dist/handlers");

    const sharedEnv = {
      TABLE_NAME: table.tableName,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER",
      JWT_SECRET: process.env.JWT_SECRET || "CHANGE-ME-IN-PRODUCTION",
      ACCOUNT_KEY_SECRET:
        process.env.ACCOUNT_KEY_SECRET || "CHANGE-ME-32-BYTE-BASE64-KEY",
    };

    const authFunction = new lambda.Function(this, "AuthFunction", {
      functionName: "spendings-categorizer-auth",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "auth.handler",
      code: lambda.Code.fromAsset(backendDist, {
        exclude: ["statements.*", "categories.*", "accounts.*"],
      }),
      environment: sharedEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });

    const statementsFunction = new lambda.Function(this, "StatementsFunction", {
      functionName: "spendings-categorizer-statements",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "statements.handler",
      code: lambda.Code.fromAsset(backendDist, {
        exclude: ["auth.*", "families.*", "categories.*", "accounts.*"],
      }),
      environment: sharedEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });

    const familiesFunction = new lambda.Function(this, "FamiliesFunction", {
      functionName: "spendings-categorizer-families",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "families.handler",
      code: lambda.Code.fromAsset(backendDist, {
        exclude: ["auth.*", "statements.*", "categories.*", "accounts.*"],
      }),
      environment: sharedEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });

    const categoriesFunction = new lambda.Function(this, "CategoriesFunction", {
      functionName: "spendings-categorizer-categories",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "categories.handler",
      code: lambda.Code.fromAsset(backendDist, {
        exclude: ["auth.*", "families.*", "accounts.*"],
      }),
      environment: sharedEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });

    const accountsFunction = new lambda.Function(this, "AccountsFunction", {
      functionName: "spendings-categorizer-accounts",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "accounts.handler",
      code: lambda.Code.fromAsset(backendDist, {
        exclude: ["auth.*", "statements.*", "categories.*", "families.*"],
      }),
      environment: sharedEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });

    const pierreFunction = new lambda.Function(this, "PierreFunction", {
      functionName: "spendings-categorizer-pierre",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "pierre.handler",
      code: lambda.Code.fromAsset(backendDist, {
        exclude: ["auth.*", "families.*", "categories.*"],
      }),
      environment: {
        ...sharedEnv,
        PIERRE_API_KEY: process.env.PIERRE_API_KEY || "",
        PIERRE_USER_ID: process.env.PIERRE_USER_ID || "",
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    new events.Rule(this, "PierreSyncSchedule", {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      targets: [new targets.LambdaFunction(pierreFunction)],
    });

    table.grantReadWriteData(authFunction);
    table.grantReadWriteData(statementsFunction);
    table.grantReadWriteData(familiesFunction);
    table.grantReadWriteData(categoriesFunction);
    table.grantReadWriteData(accountsFunction);
    table.grantReadWriteData(pierreFunction);

    const httpApi = new apigatewayv2.HttpApi(this, "HttpApi", {
      apiName: "spendings-categorizer-api",
      corsPreflight: {
        allowOrigins: [
          "https://lucasdelevy.github.io",
          "http://localhost:5173",
        ],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["Content-Type", "Authorization"],
        maxAge: cdk.Duration.hours(24),
      },
    });

    const authIntegration = new integrations.HttpLambdaIntegration(
      "AuthIntegration",
      authFunction,
    );
    const statementsIntegration = new integrations.HttpLambdaIntegration(
      "StatementsIntegration",
      statementsFunction,
    );
    const familiesIntegration = new integrations.HttpLambdaIntegration(
      "FamiliesIntegration",
      familiesFunction,
    );
    const categoriesIntegration = new integrations.HttpLambdaIntegration(
      "CategoriesIntegration",
      categoriesFunction,
    );
    const accountsIntegration = new integrations.HttpLambdaIntegration(
      "AccountsIntegration",
      accountsFunction,
    );
    httpApi.addRoutes({
      path: "/auth/google",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: authIntegration,
    });
    httpApi.addRoutes({
      path: "/auth/me",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: authIntegration,
    });
    httpApi.addRoutes({
      path: "/auth/logout",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: authIntegration,
    });
    httpApi.addRoutes({
      path: "/statements",
      methods: [apigatewayv2.HttpMethod.GET, apigatewayv2.HttpMethod.POST],
      integration: statementsIntegration,
    });
    httpApi.addRoutes({
      path: "/statements/{id}",
      methods: [apigatewayv2.HttpMethod.GET, apigatewayv2.HttpMethod.DELETE],
      integration: statementsIntegration,
    });
    httpApi.addRoutes({
      path: "/statements/{id}/assign-account",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: statementsIntegration,
    });
    httpApi.addRoutes({
      path: "/families",
      methods: [apigatewayv2.HttpMethod.POST, apigatewayv2.HttpMethod.PUT],
      integration: familiesIntegration,
    });
    httpApi.addRoutes({
      path: "/families/mine",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: familiesIntegration,
    });
    httpApi.addRoutes({
      path: "/families/members",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: familiesIntegration,
    });
    httpApi.addRoutes({
      path: "/families/members/{email}",
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: familiesIntegration,
    });

    httpApi.addRoutes({
      path: "/categories",
      methods: [apigatewayv2.HttpMethod.GET, apigatewayv2.HttpMethod.PUT],
      integration: categoriesIntegration,
    });
    httpApi.addRoutes({
      path: "/categories/recategorize",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: categoriesIntegration,
    });
    httpApi.addRoutes({
      path: "/categories/rename",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: categoriesIntegration,
    });
    httpApi.addRoutes({
      path: "/categories/ignore",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: categoriesIntegration,
    });
    httpApi.addRoutes({
      path: "/categories/hide",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: categoriesIntegration,
    });
    httpApi.addRoutes({
      path: "/categories/apply",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: categoriesIntegration,
    });

    httpApi.addRoutes({
      path: "/accounts",
      methods: [apigatewayv2.HttpMethod.GET, apigatewayv2.HttpMethod.POST],
      integration: accountsIntegration,
    });
    httpApi.addRoutes({
      path: "/accounts/{id}",
      methods: [apigatewayv2.HttpMethod.PUT, apigatewayv2.HttpMethod.DELETE],
      integration: accountsIntegration,
    });

    const pierreIntegration = new integrations.HttpLambdaIntegration(
      "PierreIntegration",
      pierreFunction,
    );
    httpApi.addRoutes({
      path: "/pierre/sync",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: pierreIntegration,
    });

    const defaultStage = httpApi.defaultStage!.node
      .defaultChild as apigatewayv2.CfnStage;

    defaultStage.defaultRouteSettings = {
      throttlingBurstLimit: 100,
      throttlingRateLimit: 50,
    };

    defaultStage.routeSettings = {
      "POST /auth/google": {
        ThrottlingBurstLimit: 10,
        ThrottlingRateLimit: 5,
      },
      "POST /auth/logout": {
        ThrottlingBurstLimit: 10,
        ThrottlingRateLimit: 5,
      },
      "GET /auth/me": {
        ThrottlingBurstLimit: 20,
        ThrottlingRateLimit: 10,
      },
    };

    new cdk.CfnOutput(this, "ApiUrl", {
      value: httpApi.apiEndpoint,
      description: "HTTP API Gateway endpoint URL",
    });

    new cdk.CfnOutput(this, "TableName", {
      value: table.tableName,
    });
  }
}
