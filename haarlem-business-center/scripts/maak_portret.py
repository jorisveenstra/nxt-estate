from PIL import Image
import hashlib,json,glob,os
Image.MAX_IMAGE_PIPEL=None
Image.MAX_IMAGE_PIXELS=None
C={"HBC Spaarne kant.4":.42,"HBC Waarderweg":.33,"HBC entree close up":.30,"HBC punt orgineel":.55,"Onder het dek":.5,"Punt closeup":.62,
"Units met glazen gevel gecombineerd":.45,"Units standaard met glazen overhead deur":.78,"g33":.30,"h26.1":.5,"h26.10":.55,"h26.2":.6,"h7":.5,"j19":.45,"j38.3":.5,"j38":.4}
meta={}
for n,c in C.items():
    p=f"work/orig/{n}.png"; im=Image.open(p).convert("RGB"); w,h=im.size
    cw=round(h*9/16); x=min(max(round(w*c-cw/2),0),w-cw)
    out=im.crop((x,0,x+cw,h)).resize((1080,1920),Image.LANCZOS)
    k=n.replace(" ","_").replace(".","-")
    out.save(f"work/portrait/{k}.png")
    meta[k]={"source":n+".png","sha256":hashlib.sha256(open(p,'rb').read()).hexdigest(),"crop":[x,0,cw,h]}
json.dump(meta,open("work/portrait/meta.json","w"),indent=1)
ims=[Image.open(f"work/portrait/{k}.png").resize((270,480)) for k in meta]
s=Image.new("RGB",(270*8,480*2))
for i,m in enumerate(ims): s.paste(m,((i%8)*270,(i//8)*480))
s.save("psheet.jpg")
print(list(meta))
