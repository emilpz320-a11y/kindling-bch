import{hexToBin as N,flattenBinArray as o}from"./hex-6kv1J7MV.js";import{a as n}from"./bch-spec-opcodes-DjZC9vjW.js";import{d as t,p as U,q as D}from"./instruction-sets-utils-CbPT-jQQ.js";import{e as E}from"./push-DdUrAOwR.js";const s=`
# This file can be run with CashProof to prove that the optimisations preserve exact functionality
# This includes most of SolidCash's bytecode optimisations, although some are incompatible with CashProof

# Hardcoded arithmetic
# OP_NOT OP_IF                         <=> OP_NOTIF;
OP_1 OP_ADD                            <=> OP_1ADD;
OP_1 OP_SUB                            <=> OP_1SUB;
OP_1 OP_NEGATE                         <=> OP_1NEGATE;
OP_0 OP_NUMEQUAL OP_NOT                <=> OP_0NOTEQUAL;
OP_NUMEQUAL OP_NOT                     <=> OP_NUMNOTEQUAL;
OP_SHA256 OP_SHA256                    <=> OP_HASH256;
OP_SHA256 OP_RIPEMD160                 <=> OP_HASH160;

# Hardcoded stack ops
OP_2 OP_PICK OP_1 OP_PICK OP_3 OP_PICK <=> OP_3DUP OP_SWAP;
OP_2 OP_PICK OP_2 OP_PICK OP_2 OP_PICK <=> OP_3DUP;

OP_0 OP_PICK OP_2 OP_PICK              <=> OP_2DUP OP_SWAP;
OP_2 OP_PICK OP_4 OP_PICK              <=> OP_2OVER OP_SWAP;
OP_3 OP_PICK OP_3 OP_PICK              <=> OP_2OVER;

OP_2 OP_ROLL OP_3 OP_ROLL              <=> OP_2SWAP OP_SWAP;
OP_3 OP_ROLL OP_3 OP_ROLL              <=> OP_2SWAP;
OP_4 OP_ROLL OP_5 OP_ROLL              <=> OP_2ROT OP_SWAP;
OP_5 OP_ROLL OP_5 OP_ROLL              <=> OP_2ROT;

OP_0 OP_PICK                           <=> OP_DUP;
OP_1 OP_PICK                           <=> OP_OVER;
OP_0 OP_ROLL                           <=> ;
OP_1 OP_ROLL                           <=> OP_SWAP;
OP_2 OP_ROLL                           <=> OP_ROT;
OP_DROP OP_DROP                        <=> OP_2DROP;

# Secondary effects
OP_DUP OP_SWAP                         <=> OP_DUP;
OP_SWAP OP_SWAP                        <=> ;
OP_2SWAP OP_2SWAP                      <=> ;
OP_ROT OP_ROT OP_ROT                   <=> ;
OP_2ROT OP_2ROT OP_2ROT                <=> ;
OP_OVER OP_OVER                        <=> OP_2DUP;
OP_DUP OP_DROP                         <=> ;
OP_DUP OP_NIP                          <=> ;
OP_DUP OP_1ADD OP_NIP                   <=> OP_1ADD;
OP_DUP OP_1SUB OP_NIP                   <=> OP_1SUB;

# Enabling secondary effects
OP_DUP OP_OVER                         <=> OP_DUP OP_DUP;

# Merge OP_VERIFY
OP_EQUAL OP_VERIFY                     <=> OP_EQUALVERIFY;
OP_NUMEQUAL OP_VERIFY                  <=> OP_NUMEQUALVERIFY;
OP_CHECKSIG OP_VERIFY                  <=> OP_CHECKSIGVERIFY;
# OP_CHECKMULTISIG OP_VERIFY           <=> OP_CHECKMULTISIGVERIFY;
OP_CHECKDATASIG OP_VERIFY              <=> OP_CHECKDATASIGVERIFY;

# Remove/replace extraneous OP_SWAP
# OP_SWAP OP_AND                         <=> OP_AND;
# OP_SWAP OP_OR                          <=> OP_OR;
# OP_SWAP OP_XOR                         <=> OP_XOR;
OP_SWAP OP_ADD                         <=> OP_ADD;
# Explicit VERIFY variants must appear before their shorter counterparts
# to prevent partial matching when word boundary assertions are used.
OP_SWAP OP_EQUALVERIFY                 <=> OP_EQUALVERIFY;
OP_SWAP OP_EQUAL                       <=> OP_EQUAL;
OP_SWAP OP_NUMEQUALVERIFY              <=> OP_NUMEQUALVERIFY;
OP_SWAP OP_NUMEQUAL                    <=> OP_NUMEQUAL;
OP_SWAP OP_NUMNOTEQUAL                 <=> OP_NUMNOTEQUAL;
OP_SWAP OP_GREATERTHANOREQUAL          <=> OP_LESSTHANOREQUAL;
OP_SWAP OP_LESSTHANOREQUAL             <=> OP_GREATERTHANOREQUAL;
OP_SWAP OP_GREATERTHAN                 <=> OP_LESSTHAN;
OP_SWAP OP_LESSTHAN                    <=> OP_GREATERTHAN;
OP_SWAP OP_DROP                        <=> OP_NIP;
OP_SWAP OP_NIP                         <=> OP_DROP;

# Remove/replace extraneous OP_DUP
# OP_DUP OP_AND                         <=> ;
# OP_DUP OP_OR                          <=> ;
OP_DUP OP_DROP                        <=> ;
OP_DUP OP_NIP                         <=> ;

# Random optimisations (don't know what I'm targeting with this)
OP_2DUP OP_DROP                        <=> OP_OVER;
OP_2DUP OP_NIP                         <=> OP_DUP;
OP_CAT OP_DROP                         <=> OP_2DROP;
OP_NIP OP_DROP                         <=> OP_2DROP;

# Far-fetched stuff
OP_DUP OP_ROT OP_SWAP OP_DROP          <=> OP_SWAP;
OP_OVER OP_ROT OP_SWAP OP_DROP         <=> OP_SWAP;
OP_2 OP_PICK OP_ROT OP_SWAP OP_DROP    <=> OP_SWAP;
OP_3 OP_PICK OP_ROT OP_SWAP OP_DROP    <=> OP_SWAP;
OP_4 OP_PICK OP_ROT OP_SWAP OP_DROP    <=> OP_SWAP;
OP_5 OP_PICK OP_ROT OP_SWAP OP_DROP    <=> OP_SWAP;
OP_6 OP_PICK OP_ROT OP_SWAP OP_DROP    <=> OP_SWAP;
OP_7 OP_PICK OP_ROT OP_SWAP OP_DROP    <=> OP_SWAP;
OP_8 OP_PICK OP_ROT OP_SWAP OP_DROP    <=> OP_SWAP;
OP_9 OP_PICK OP_ROT OP_SWAP OP_DROP    <=> OP_SWAP;
OP_10 OP_PICK OP_ROT OP_SWAP OP_DROP   <=> OP_SWAP;
OP_11 OP_PICK OP_ROT OP_SWAP OP_DROP   <=> OP_SWAP;
OP_12 OP_PICK OP_ROT OP_SWAP OP_DROP   <=> OP_SWAP;
OP_13 OP_PICK OP_ROT OP_SWAP OP_DROP   <=> OP_SWAP;
OP_14 OP_PICK OP_ROT OP_SWAP OP_DROP   <=> OP_SWAP;
OP_15 OP_PICK OP_ROT OP_SWAP OP_DROP   <=> OP_SWAP;
OP_16 OP_PICK OP_ROT OP_SWAP OP_DROP   <=> OP_SWAP;

OP_DUP OP_ROT OP_DROP                  <=> OP_NIP OP_DUP;
OP_OVER OP_ROT OP_DROP                 <=> OP_SWAP;
OP_2 OP_PICK OP_ROT OP_DROP            <=> OP_NIP OP_OVER;

OP_0 OP_NIP                            <=> OP_DROP OP_0;
OP_1 OP_NIP                            <=> OP_DROP OP_1;
OP_2 OP_NIP                            <=> OP_DROP OP_2;
OP_3 OP_NIP                            <=> OP_DROP OP_3;
OP_4 OP_NIP                            <=> OP_DROP OP_4;
OP_5 OP_NIP                            <=> OP_DROP OP_5;
OP_6 OP_NIP                            <=> OP_DROP OP_6;
OP_7 OP_NIP                            <=> OP_DROP OP_7;
OP_8 OP_NIP                            <=> OP_DROP OP_8;
OP_9 OP_NIP                            <=> OP_DROP OP_9;
OP_10 OP_NIP                           <=> OP_DROP OP_10;
OP_11 OP_NIP                           <=> OP_DROP OP_11;
OP_12 OP_NIP                           <=> OP_DROP OP_12;
OP_13 OP_NIP                           <=> OP_DROP OP_13;
OP_14 OP_NIP                           <=> OP_DROP OP_14;
OP_15 OP_NIP                           <=> OP_DROP OP_15;
OP_16 OP_NIP                           <=> OP_DROP OP_16;

OP_2 OP_PICK OP_SWAP OP_2 OP_PICK OP_NIP <=> OP_DROP OP_2DUP;

# .slice(0, x) optimisation & .slice(x, y.length) optimisation
OP_0 OP_SPLIT OP_NIP                   <=> ;
OP_SIZE OP_SPLIT OP_DROP               <=> ;

# These are new optimisations that we cannot prove since CashProof doesn't work any more
# //////////////////////////////////////////////////////////////////////////////////////

OP_LESSTHAN OP_NOT                     <=> OP_GREATERTHANOREQUAL;
OP_GREATERTHAN OP_NOT                  <=> OP_LESSTHANOREQUAL;
OP_LESSTHANOREQUAL OP_NOT              <=> OP_GREATERTHAN;
OP_GREATERTHANOREQUAL OP_NOT           <=> OP_LESSTHAN;
`,i=[["OP_1 OP_ADD","OP_1ADD"],["OP_1 OP_SUB","OP_1SUB"],["OP_1 OP_NEGATE","OP_1NEGATE"],["OP_0 OP_NUMEQUAL OP_NOT","OP_0NOTEQUAL"],["OP_NUMEQUAL OP_NOT","OP_NUMNOTEQUAL"],["OP_SHA256 OP_SHA256","OP_HASH256"],["OP_SHA256 OP_RIPEMD160","OP_HASH160"],["OP_2 OP_PICK OP_1 OP_PICK OP_3 OP_PICK","OP_3DUP OP_SWAP"],["OP_2 OP_PICK OP_2 OP_PICK OP_2 OP_PICK","OP_3DUP"],["OP_0 OP_PICK OP_2 OP_PICK","OP_2DUP OP_SWAP"],["OP_2 OP_PICK OP_4 OP_PICK","OP_2OVER OP_SWAP"],["OP_3 OP_PICK OP_3 OP_PICK","OP_2OVER"],["OP_2 OP_ROLL OP_3 OP_ROLL","OP_2SWAP OP_SWAP"],["OP_3 OP_ROLL OP_3 OP_ROLL","OP_2SWAP"],["OP_4 OP_ROLL OP_5 OP_ROLL","OP_2ROT OP_SWAP"],["OP_5 OP_ROLL OP_5 OP_ROLL","OP_2ROT"],["OP_0 OP_PICK","OP_DUP"],["OP_1 OP_PICK","OP_OVER"],["OP_0 OP_ROLL",""],["OP_1 OP_ROLL","OP_SWAP"],["OP_2 OP_ROLL","OP_ROT"],["OP_DROP OP_DROP","OP_2DROP"],["OP_DUP OP_SWAP","OP_DUP"],["OP_SWAP OP_SWAP",""],["OP_2SWAP OP_2SWAP",""],["OP_ROT OP_ROT OP_ROT",""],["OP_2ROT OP_2ROT OP_2ROT",""],["OP_OVER OP_OVER","OP_2DUP"],["OP_DUP OP_DROP",""],["OP_DUP OP_NIP",""],["OP_DUP OP_1ADD OP_NIP","OP_1ADD"],["OP_DUP OP_1SUB OP_NIP","OP_1SUB"],["OP_DUP OP_OVER","OP_DUP OP_DUP"],["OP_EQUAL OP_VERIFY","OP_EQUALVERIFY"],["OP_NUMEQUAL OP_VERIFY","OP_NUMEQUALVERIFY"],["OP_CHECKSIG OP_VERIFY","OP_CHECKSIGVERIFY"],["OP_CHECKDATASIG OP_VERIFY","OP_CHECKDATASIGVERIFY"],["OP_SWAP OP_ADD","OP_ADD"],["OP_SWAP OP_EQUALVERIFY","OP_EQUALVERIFY"],["OP_SWAP OP_EQUAL","OP_EQUAL"],["OP_SWAP OP_NUMEQUALVERIFY","OP_NUMEQUALVERIFY"],["OP_SWAP OP_NUMEQUAL","OP_NUMEQUAL"],["OP_SWAP OP_NUMNOTEQUAL","OP_NUMNOTEQUAL"],["OP_SWAP OP_GREATERTHANOREQUAL","OP_LESSTHANOREQUAL"],["OP_SWAP OP_LESSTHANOREQUAL","OP_GREATERTHANOREQUAL"],["OP_SWAP OP_GREATERTHAN","OP_LESSTHAN"],["OP_SWAP OP_LESSTHAN","OP_GREATERTHAN"],["OP_SWAP OP_DROP","OP_NIP"],["OP_SWAP OP_NIP","OP_DROP"],["OP_DUP OP_DROP",""],["OP_DUP OP_NIP",""],["OP_2DUP OP_DROP","OP_OVER"],["OP_2DUP OP_NIP","OP_DUP"],["OP_CAT OP_DROP","OP_2DROP"],["OP_NIP OP_DROP","OP_2DROP"],["OP_DUP OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_OVER OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_2 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_3 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_4 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_5 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_6 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_7 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_8 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_9 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_10 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_11 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_12 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_13 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_14 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_15 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_16 OP_PICK OP_ROT OP_SWAP OP_DROP","OP_SWAP"],["OP_DUP OP_ROT OP_DROP","OP_NIP OP_DUP"],["OP_OVER OP_ROT OP_DROP","OP_SWAP"],["OP_2 OP_PICK OP_ROT OP_DROP","OP_NIP OP_OVER"],["OP_0 OP_NIP","OP_DROP OP_0"],["OP_1 OP_NIP","OP_DROP OP_1"],["OP_2 OP_NIP","OP_DROP OP_2"],["OP_3 OP_NIP","OP_DROP OP_3"],["OP_4 OP_NIP","OP_DROP OP_4"],["OP_5 OP_NIP","OP_DROP OP_5"],["OP_6 OP_NIP","OP_DROP OP_6"],["OP_7 OP_NIP","OP_DROP OP_7"],["OP_8 OP_NIP","OP_DROP OP_8"],["OP_9 OP_NIP","OP_DROP OP_9"],["OP_10 OP_NIP","OP_DROP OP_10"],["OP_11 OP_NIP","OP_DROP OP_11"],["OP_12 OP_NIP","OP_DROP OP_12"],["OP_13 OP_NIP","OP_DROP OP_13"],["OP_14 OP_NIP","OP_DROP OP_14"],["OP_15 OP_NIP","OP_DROP OP_15"],["OP_16 OP_NIP","OP_DROP OP_16"],["OP_2 OP_PICK OP_SWAP OP_2 OP_PICK OP_NIP","OP_DROP OP_2DUP"],["OP_0 OP_SPLIT OP_NIP",""],["OP_SIZE OP_SPLIT OP_DROP",""]],W=[["OP_LESSTHAN OP_NOT","OP_GREATERTHANOREQUAL"],["OP_GREATERTHAN OP_NOT","OP_LESSTHANOREQUAL"],["OP_LESSTHANOREQUAL OP_NOT","OP_GREATERTHAN"],["OP_GREATERTHANOREQUAL OP_NOT","OP_LESSTHAN"],["OP_NOT OP_IF","OP_NOTIF"],["OP_CHECKMULTISIG OP_VERIFY","OP_CHECKMULTISIGVERIFY"],["OP_SWAP OP_AND","OP_AND"],["OP_SWAP OP_OR","OP_OR"],["OP_SWAP OP_XOR","OP_XOR"],["OP_DUP OP_AND",""],["OP_DUP OP_OR",""]],L=[...i,...W];L.map(([O,P])=>({pattern:O,replacement:P,regex:new RegExp(`${O}(\\s|$)`,"g")}));const e=n;function Q(O){return K(r(O))}function V(O){return f(r(O))}function d(O){return C(p(O))}const a=80,I=129,T=O=>O.length===1&&(O[0]!==0&&O[0]<=16||O[0]===I);function c(O){if(typeof O=="number")return 1;const{length:P}=O;return P===0||T(O)?1:P<=75?P+1:P<=255?P+2:P<=65535?P+3:P+5}function r(O){let P=0;for(const S of O)P+=c(S);const R=new Uint8Array(P);let _=0;for(const S of O){if(typeof S=="number"){R[_]=S,_+=1;continue}const{length:A}=S;if(A===1&&T(S)){R[_]=S[0]===I?e.OP_1NEGATE:S[0]+a,_+=1;continue}A<=75?(R[_]=A,_+=1):A<=255?(R[_]=e.OP_PUSHDATA_1,R[_+1]=A,_+=2):A<=65535?(R[_]=e.OP_PUSHDATA_2,R[_+1]=A&255,R[_+2]=A>>>8&255,_+=3):(R[_]=e.OP_PUSHDATA_4,R[_+1]=A&255,R[_+2]=A>>>8&255,R[_+3]=A>>>16&255,R[_+4]=A>>>24&255,_+=5),R.set(S,_),_+=A}return R}function C(O){return t(O).map(_=>"data"in _?_.data:_.opcode)}function p(O){if(O=O.replace(/\s+/g," ").trim(),O==="")return new Uint8Array(0);const P=O.split(" ").map(R=>{if(R.startsWith("OP_")){const S=e[R];if(S===void 0)throw new Error(`asmToBytecode: unknown opcode "${R}"`);return{opcode:S}}const _=R.replace(/<|>/g,"").replace(/^0x/,"");return t(E(N(_)))[0]});return U(P)}function K(O){let P=D(O);return P=P.replace(/OP_PUSHBYTES_[^\s]+/g,""),P=P.replace(/OP_PUSHDATA[^\s]+ [^\s]+/g,""),P=P.replace(/(^|\s)0x/g," "),P=P.replace(/\s+/g," ").trim(),P}function f(O){let P=D(O);return P=P.replace(/OP_PUSHBYTES_[^\s]+/g,""),P=P.replace(/OP_PUSHDATA[^\s]+ [^\s]+/g,""),P=P.replace(/(^|\s)(0x\w*)/g," <$2>"),P=P.replace(/\s+/g," ").trim(),P}function h(O){return O.filter(P=>typeof P=="number").filter(P=>P>e.OP_16).length}function F(O){return o(O.map(P=>typeof P=="number"?new Uint8Array([P]):E(P)))}function G(O,P){return[...P.slice().reverse(),...O]}s.split(`
`).map(O=>O.trim()).filter(O=>!O.startsWith("#")).join("").split(";").map(O=>O.trim()).map(O=>O.split("<=>").map(P=>P.trim())).filter(O=>O.length===2).map(([O,P])=>({regex:new RegExp(O.replace(/(OP_\w+)/g,"$1(?=\\s|$)"),"g"),replacement:P}));export{e as O,p as a,d as b,K as c,f as d,C as e,h as f,F as g,G as h,V as i,r as j,Q as s};
