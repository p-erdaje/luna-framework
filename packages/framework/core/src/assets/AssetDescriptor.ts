/**
 * AssetDescriptor
 *
 * Describes a single asset to load. A discriminated union on `type`
 * means TypeScript enforces exactly the right fields per asset type at
 * compile time — an "atlas" descriptor can't be created without its
 * required `atlasDataUrl`, for example.
 */
export type AssetDescriptor =
  | { readonly key: string; readonly type: "image"; readonly url: string }
  | { readonly key: string; readonly type: "audio"; readonly url: string }
  | { readonly key: string; readonly type: "json"; readonly url: string }
  | { readonly key: string; readonly type: "atlas"; readonly url: string; readonly atlasDataUrl: string };
