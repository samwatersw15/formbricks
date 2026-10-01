export type DataLayerPrimitive = string | number | boolean | null;
export type DataLayerValue = DataLayerPrimitive | DataLayerValue[] | { [key: string]: DataLayerValue };
export type DataLayerParameters = Record<string, DataLayerValue>;
export type DataLayerEvent = { event: string } & DataLayerParameters;

type DataLayerWindow = Window & { dataLayer?: DataLayerEvent[] };
const pageDedupeKeys = new Set<string>();

export function pushDataLayer(
  event: string,
  parameters: DataLayerParameters = {},
  options: { dedupeKey?: string } = {}
): void {
  if (typeof window === 'undefined') return;
  if (options.dedupeKey && pageDedupeKeys.has(options.dedupeKey)) return;
  const target = window as DataLayerWindow;
  target.dataLayer = target.dataLayer ?? [];
  target.dataLayer.push({ event, ...parameters });
  if (options.dedupeKey) pageDedupeKeys.add(options.dedupeKey);
}
