from PIL import Image, ImageDraw, ImageFont, ImageFilter
src="source-bg-1024x576.jpg"
W,H=1600,900
im=Image.open(src).convert("RGB").resize((W,H),Image.LANCZOS)
# left dark gradient for readability
g=Image.new("L",(W,H))
gd=ImageDraw.Draw(g)
for x in range(W):
    a=int(max(0,min(1,(0.62-x/W)/0.62))**1.3*215)
    gd.line([(x,0),(x,H)],fill=a)
im=Image.composite(Image.new("RGB",(W,H),(8,6,20)),im,g)
F="/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
def font(sz,w):
    f=ImageFont.truetype(F,sz)
    try: f.set_variation_by_axes([32,w])
    except Exception: f.set_variation_by_axes([w])
    return f
d=ImageDraw.Draw(im)
x=96
d.text((x,250),"AI-АРХИТЕКТОР",font=font(54,600),fill=(255,176,72))
NAME="КАРПОВ НИКОЛАЙ"
sz=128
while True:
    big=font(sz,800)
    if ImageDraw.Draw(Image.new("RGB",(1,1))).textlength(NAME,font=big)<=800: break
    sz-=2
print(sz)
# glow
glow=Image.new("RGBA",(W,H),(0,0,0,0)); gd2=ImageDraw.Draw(glow)
gd2.text((x,318),NAME,font=big,fill=(168,110,255,200))
glow=glow.filter(ImageFilter.GaussianBlur(18))
im=Image.alpha_composite(im.convert("RGBA"),glow)
d=ImageDraw.Draw(im)
d.text((x,318),NAME,font=big,fill=(255,255,255))
d.rectangle([x,510,x+120,516],fill=(255,176,72))
d.text((x,548),"Практика внедрения ИИ в рабочие процессы",font=font(34,500),fill=(222,214,245))
im.convert("RGB").save("vc-cover.png")
im.convert("RGB").save("vc-cover.jpg",quality=92)
