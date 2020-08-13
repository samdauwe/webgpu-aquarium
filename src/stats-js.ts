export default async function() {
  // @ts-ignore
  const statsjsModule = await import(/* webpackIgnore: true */ 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/r17/Stats.min.js');
  const statsjs = await statsjsModule.default();
  return statsjs;
}
