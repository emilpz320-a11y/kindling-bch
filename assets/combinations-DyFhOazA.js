import{a,r}from"./default-crypto-instances-Bf0AEOdg.js";const e=(s,h={ripemd160:r,sha256:a})=>h.ripemd160.hash(h.sha256.hash(s)),i=(s,h=a)=>h.hash(h.hash(s));export{e as hash160,i as hash256};
