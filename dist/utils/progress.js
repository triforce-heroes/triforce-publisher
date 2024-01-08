import t from"chalk";export function printProgress(o,s,e){let r=t.bold(`(${(100/s*o).toFixed(2)}%)`),i=`- ${r} ${o} of ${s}:
`;if(process.stdout.write(i),e){let o=e.from??t.italic("<empty>"),s=e.to??t.italic("<empty>");process.stdout.write(t.gray(`  * ${o.slice(0,process.stdout.columns-4)}
`)),process.stdout.write(t.gray(`  * ${s.slice(0,process.stdout.columns-4)}
`))}process.stdout.write("\n")}