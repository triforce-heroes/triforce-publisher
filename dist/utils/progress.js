import t from"chalk";export function printFailure(s,o,r,e,i){let c=t.red(`(DRIVER: ${r})`),p=t.bold(`(${(100/o*s).toFixed(2)}%)`),u=`- ${p} ${String(s)} of ${String(o)}: ${c}
`;process.stdout.write(u),process.stdout.write(t.gray(`  * ${e.slice(0,process.stdout.columns-4)}
`)),process.stdout.write(t.gray(`  * ${i.slice(0,process.stdout.columns-4)}
`)),process.stdout.write("\n")}export function printProgress(s,o,r){let e=t.bold(`(${(100/o*s).toFixed(2)}%)`),i=`- ${e} ${String(s)} of ${String(o)}:
`;if(process.stdout.write(i),r){let s=r.from??t.italic("<empty>"),o=r.to??t.italic("<empty>");process.stdout.write(t.gray(`  * ${s.slice(0,process.stdout.columns-4)}
`)),process.stdout.write(t.gray(`  * ${o.slice(0,process.stdout.columns-4)}
`))}process.stdout.write("\n")}