import * as cdk from "aws-cdk-lib";
import { SpendingsCategorizerStack } from "../lib/stack.js";

const app = new cdk.App();

new SpendingsCategorizerStack(app, "SpendingsCategorizerStack", {
  env: {
    account: "905418115093",
    region: "us-east-1",
  },
});
