export interface LabMeta {
  key: string;
  order: number;
  month: string;
  title: string;
  blurb: string;
}

const labModules = import.meta.glob<Omit<LabMeta, "key">>("/../../*/lab.json", {
  eager: true,
  import: "default",
});

function parseLabKey(path: string): string {
  const match = path.match(/([^/]+)\/lab\.json$/);
  if (!match) {
    throw new Error(`labs: could not parse lab key from path: ${path}`);
  }
  return match[1];
}

export const LABS: LabMeta[] = Object.entries(labModules)
  .map(([path, meta]) => ({ key: parseLabKey(path), ...meta }))
  .sort((a, b) => a.order - b.order);

export function labFor(key: string): LabMeta | undefined {
  return LABS.find((lab) => lab.key === key);
}

export function titleCase(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
