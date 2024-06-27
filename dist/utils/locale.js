export const supportedLocales=["en","es","fr","it","pt","de","nl","ja","zh","ko","ru"];export const weakLocales=["ja","zh","ko"];export const weakLocalesFull=[...weakLocales,"fr","it","de","nl","ru"];let e=[["en","en_us","USen","EUen","english","ukenglish"],["es","es_us","USes","EUes","spanish","naspanish"],["fr","fr_us","USfr","EUfr","french","nafrench"],["it","EUit","italian"],["pt","pt_pt","pt_br","EUpt","portuguese"],["de","EUde","german"],["nl","EUnl","dutch"],["ja","jp","JPja","japanese"],["zh","ch","ch_tw","ch_zh","CNzh","TWzh","CNzh","cntraditional","cnsimplified"],["ko","kr","KRko","KOkr","korean"],["ru","EUru","russian"]];export function guessLocale(n){return e.find(e=>e.find(e=>e===n))?.[0]}export function simplifyLocales(e){let n=new Set;for(let s of e)if(s.endsWith("_us")){let[t]=s.split("_",2);e.includes(t)||n.add(s)}else n.add(s);return[...n]}