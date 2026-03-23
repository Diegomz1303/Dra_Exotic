import { insforge } from "./insforge";

export const fetcher = async (key: string) => {
  const firstColonIndex = key.indexOf(':');
  const table = firstColonIndex === -1 ? key : key.slice(0, firstColonIndex);
  const query = firstColonIndex === -1 ? null : key.slice(firstColonIndex + 1);
  
  let dbQuery = insforge.database.from(table).select('*');
  
  if (query) {
    try {
      const parsedQuery = JSON.parse(query);
      Object.entries(parsedQuery).forEach(([method, args]) => {
        // @ts-ignore
        dbQuery = dbQuery[method](...(Array.isArray(args) ? args : [args]));
      });
    } catch (e) {
      console.error("Error parsing SWR query:", e);
    }
  }

  const { data, error } = await dbQuery;
  if (error) throw error;
  return data;
};
