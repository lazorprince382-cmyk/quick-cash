/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as checkApi from "../checkApi.js";
import type * as cron from "../cron.js";
import type * as deposits from "../deposits.js";
import type * as investments from "../investments.js";
import type * as packages from "../packages.js";
import type * as signin from "../signin.js";
import type * as signup from "../signup.js";
import type * as users from "../users.js";
import type * as withdraws from "../withdraws.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  checkApi: typeof checkApi;
  cron: typeof cron;
  deposits: typeof deposits;
  investments: typeof investments;
  packages: typeof packages;
  signin: typeof signin;
  signup: typeof signup;
  users: typeof users;
  withdraws: typeof withdraws;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
