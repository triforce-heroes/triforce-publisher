import t from"chalk";export function printProgress(o,s,r){let e=t.bold(`(${(100/s*o).toFixed(2)}%)`),i=`- ${e} ${String(o)} of ${String(s)}:
`;if(process.stdout.write(i),r){let o=r.from??t.italic("<empty>"),s=r.to??t.italic("<empty>");process.stdout.write(t.gray(`  * ${o.slice(0,process.stdout.columns-4)}
`)),process.stdout.write(t.gray(`  * ${s.slice(0,process.stdout.columns-4)}
`))}process.stdout.write("\n")}