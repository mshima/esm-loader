import{installSourceMapSupport as u,transform as g,transformDynamicImport as w}from"@esbuild-kit/core-utils";import _ from"get-tsconfig";import W from"path";import{init as $}from"es-module-lexer";import l from"fs";import{fileURLToPath as N}from"url";const p=/\.([cm]?ts|[tj]sx)$/,y=t=>{const r=W.extname(t);if(r===".mjs"||r===".mts")return"module";if(r===".cjs"||r===".cts")return"commonjs"};$.then(()=>{});const i=new Map;async function b(t){if(i.has(t))return i.get(t);if(!await l.promises.access(t).then(()=>!0,()=>!1)){i.set(t,void 0);return}const s=await l.promises.readFile(t,"utf8");try{const o=JSON.parse(s);return i.set(t,o),o}catch{throw new Error(`Error parsing: ${t}`)}}async function x(t){let r=new URL("package.json",t);for(;!r.pathname.endsWith("/node_modules/package.json");){const s=N(r),o=await b(s);if(o)return o;const n=r;if(r=new URL("../package.json",r),r.pathname===n.pathname)break}}async function h(t){var r;const s=await x(t);return(r=s==null?void 0:s.type)!=null?r:"commonjs"}var T=Object.defineProperty,I=Object.defineProperties,F=Object.getOwnPropertyDescriptors,j=Object.getOwnPropertySymbols,L=Object.prototype.hasOwnProperty,M=Object.prototype.propertyIsEnumerable,O=(t,r,s)=>r in t?T(t,r,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[r]=s,v=(t,r)=>{for(var s in r||(r={}))L.call(r,s)&&O(t,s,r[s]);if(j)for(var s of j(r))M.call(r,s)&&O(t,s,r[s]);return t},P=(t,r)=>I(t,F(r));const S=u(),k=_(),A=k==null?void 0:k.config,V=/\.\w+$/,E=[".js",".json",".ts",".tsx",".jsx"],C=[...E,...E.map(t=>`/index${t}`)],c=async function(t,r,s){var o;if(t.startsWith("node:")&&(t=t.slice(5)),t.endsWith("/"))return c(`${t}index`,r,s);if(/\.[cm]js$/.test(t)&&p.test(r.parentURL))try{return await c(`${t.slice(0,-2)}ts`,r,s)}catch(a){if(a.code!=="ERR_MODULE_NOT_FOUND")throw a}let n;try{n=await s(t,r,s)}catch(a){if(a instanceof Error){if(a.code==="ERR_UNSUPPORTED_DIR_IMPORT")return c(`${t}/index`,r,s);if(a.code==="ERR_MODULE_NOT_FOUND"&&!V.test(t))for(const m of C)try{const R=t+(t.endsWith("/")&&m.startsWith("/")?m.slice(1):m);return await c(R,r,s)}catch{}}throw a}if(n.url.endsWith(".json"))return P(v({},n),{format:"json"});let{format:e}=n;return n.url.startsWith("file:")&&(e=(o=y(n.url))!=null?o:e,e||(e=await h(n.url))),P(v({},n),{format:e})},q=async function(t,r,s){process.send&&process.send({type:"dependency",path:t}),t.endsWith(".json")&&(r.importAssertions||(r.importAssertions={}),r.importAssertions.type="json");const o=await s(t,r,s);if(!o.source)return o;const n=o.source.toString();if(o.format==="json"||p.test(t)){const a=await g(n,t,{format:"esm",tsconfigRaw:A});return a.map&&S.set(t,a.map),{format:"module",source:a.code}}const e=w({code:n});return e&&(o.source=e.code,e.map&&S.set(t,e.map)),o},U=_(),z=U==null?void 0:U.config,D=u(),B=async function(t,r,s){var o;return t.endsWith(".json")?{format:"module"}:t.startsWith("file:")?{format:(o=y(t))!=null?o:await h(t)}:await s(t,r,s)},H=async function(t,r,s){const{url:o}=r;if(process.send&&process.send({type:"dependency",path:o}),o.endsWith(".json")||p.test(o)){const a=await g(t.toString(),o,{format:"esm",tsconfigRaw:z});return a.map&&D.set(o,a.map),{source:a.code}}const n=await s(t,r,s),e=w({code:n.source.toString()});return e&&(n.source=e.code,e.map&&D.set(o,e.map)),n},f=[16,12,0],d=process.version.slice(1).split(".").map(Number),J=(d[0]-f[0]||d[1]-f[1]||d[2]-f[2])<0,K=J?B:void 0,Q=J?H:void 0;export{K as getFormat,q as load,c as resolve,Q as transformSource};
