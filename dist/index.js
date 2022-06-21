import l from"path";import{fileURLToPath as R,pathToFileURL as I}from"url";import{installSourceMapSupport as M,resolveTsPath as F,transform as _,applySourceMap as m,transformDynamicImport as P}from"@esbuild-kit/core-utils";import{getTsconfig as L,createPathsMatcher as x}from"get-tsconfig";import j from"fs";const f=M(),u=L(),O=u==null?void 0:u.config,k=u&&x(u),h=/\.([cm]?ts|[tj]sx)$/,v=t=>{const r=l.extname(t);if(r===".mjs"||r===".mts")return"module";if(r===".cjs"||r===".cts")return"commonjs"},d=new Map;async function $(t){if(d.has(t))return d.get(t);if(!await j.promises.access(t).then(()=>!0,()=>!1)){d.set(t,void 0);return}const s=await j.promises.readFile(t,"utf8");try{const o=JSON.parse(s);return d.set(t,o),o}catch{throw new Error(`Error parsing: ${t}`)}}async function A(t){let r=new URL("package.json",t);for(;!r.pathname.endsWith("/node_modules/package.json");){const s=R(r),o=await $(s);if(o)return o;const n=r;if(r=new URL("../package.json",r),r.pathname===n.pathname)break}}async function S(t){var r;const s=await A(t);return(r=s==null?void 0:s.type)!=null?r:"commonjs"}var V=Object.defineProperty,C=Object.defineProperties,q=Object.getOwnPropertyDescriptors,E=Object.getOwnPropertySymbols,z=Object.prototype.hasOwnProperty,B=Object.prototype.propertyIsEnumerable,U=(t,r,s)=>r in t?V(t,r,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[r]=s,D=(t,r)=>{for(var s in r||(r={}))z.call(r,s)&&U(t,s,r[s]);if(E)for(var s of E(r))B.call(r,s)&&U(t,s,r[s]);return t},J=(t,r)=>C(t,q(r));const H=[".js",".json",".ts",".tsx",".jsx"];async function W(t,r,s){let o;for(const n of H)try{return await g(t+n,r,s,!0)}catch(e){if(o===void 0){const{message:a}=e;e.message=e.message.replace(`${n}'`,"'"),e.stack=e.stack.replace(a,e.message),o=e}}throw o}async function T(t,r,s){const o=t.endsWith("/")?"index":`${l.sep}index`;try{return await W(t+o,r,s)}catch(n){const{message:e}=n;throw n.message=n.message.replace(`${o}'`,"'"),n.stack=n.stack.replace(e,n.message),n}}const b="file://",K=/^\.{0,2}\//,g=async function(t,r,s,o){var n;if(t.startsWith("node:")&&(t=t.slice(5)),t.endsWith("/"))return await T(t,r,s);const e=t.startsWith(b)||K.test(t);if(k&&!e){const c=k(t);for(const p of c)try{return await g(I(p).toString(),r,s)}catch{}}if(h.test(r.parentURL)){const c=F(t);if(c)try{return await g(c,r,s,!0)}catch(p){if(p.code!=="ERR_MODULE_NOT_FOUND")throw p}}let a;try{a=await s(t,r,s)}catch(c){if(c instanceof Error&&!o){if(c.code==="ERR_UNSUPPORTED_DIR_IMPORT")return await T(t,r,s);if(c.code==="ERR_MODULE_NOT_FOUND")return await W(t,r,s)}throw c}if(a.url.endsWith(".json"))return J(D({},a),{format:"json"});let{format:i}=a;return a.url.startsWith(b)&&(i=(n=v(a.url))!=null?n:i,i||(i=await S(a.url))),J(D({},a),{format:i})},Q=async function(t,r,s){process.send&&process.send({type:"dependency",path:t}),t.endsWith(".json")&&(r.importAssertions||(r.importAssertions={}),r.importAssertions.type="json");const o=await s(t,r,s);if(!o.source)return o;const n=o.source.toString();if(o.format==="json"||h.test(t)){const a=await _(n,t,{tsconfigRaw:O});return{format:"module",source:m(a,t,f)}}const e=P(n);return e&&(o.source=m(e,t,f)),o},X=async function(t,r,s){var o;return t.endsWith(".json")?{format:"module"}:t.startsWith("file:")?{format:(o=v(t))!=null?o:await S(t)}:await s(t,r,s)},Y=async function(t,r,s){const{url:o}=r;if(process.send&&process.send({type:"dependency",path:o}),o.endsWith(".json")||h.test(o)){const a=await _(t.toString(),o,{tsconfigRaw:O});return{source:m(a,o,f)}}const n=await s(t,r,s),e=P(n.source.toString());return e&&(n.source=m(e,o,f)),n},w=[16,12,0],y=process.version.slice(1).split(".").map(Number),N=(y[0]-w[0]||y[1]-w[1]||y[2]-w[2])<0,Z=N?X:void 0,G=N?Y:void 0;export{Z as getFormat,Q as load,g as resolve,G as transformSource};
