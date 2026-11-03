import json,subprocess,os,re
W='/tmp/claude-0/work'; os.chdir(W)
S=json.load(open('script_struct.json'))
GAP=0.45; FPS=30
def mp3dur(p): return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',p],capture_output=True,text=True).stdout)
def words(key,offset):
    j=json.load(open(f'vo/{key}.json')); a=j['alignment']; ch=a['characters']; st=a['character_start_times_seconds']; en=a['character_end_times_seconds']
    out=[];cur='';s=None;e=None
    for c,x,y in zip(ch,st,en):
        if c in ' \n':
            if cur: out.append(dict(w=cur,s=s+offset,e=e+offset)); cur=''
            continue
        if not cur: s=x
        cur+=c;e=y
    if cur: out.append(dict(w=cur,s=s+offset,e=e+offset))
    return out,j['text']
# sentence -> (clip, callout)
BODY={
1:[('p5','± 300 m²'),('p16','± 155 m² beneden'),('p17','1.000 kg/m²'),('p21','± 150 m² boven'),('p8','Eigen parkeerterrein'),('p20','± 12 m buitenterrein'),('p1','N417 → A27'),('p11','Oplevering Q1 2027'),('p5','Plan een afspraak')],
2:[('p5','Koop i.p.v. huur'),('p3','Betonnen casco · HR++'),('p8','Steenstrips & grote ramen'),('p18','Onafgewerkt beton'),('p17','Tot milieucategorie 3.1'),('p1','Zicht op de A27'),('p21','Financieel adviseur'),('p11','Oplevering Q1 2027'),('p20','Vrijblijvend gesprek')],
3:[('p3','11 nieuwe units'),('p18','± 300 m² per unit'),('p17','Milieucategorie t/m 3.1'),('p16','1.000 kg/m²'),('p20','Eigen parkeer- & achterterrein'),('p1','A27 · N417'),('p11','Oplevering Q1 2027'),('p5','Prijzen & beschikbaarheid')],
}
HOOKCLIP={1:{1:'p3',2:'p1',3:'p17',4:'p8',5:'p5'},2:{1:'p1',2:'p3',3:'p5',4:'p11',5:'p21'},3:{1:'p3',2:'p5',3:'p16',4:'p1',5:'p8'}}
HOOKACC={ # accent words per hook (lowercase stripped)
}
os.makedirs('props',exist_ok=True); os.makedirs('audio',exist_ok=True)
def shots_for(sentences_t,clipseq,total):
    # sentences_t: list of (start,end) seconds; split >5.5s into two shots using alternate halves
    shots=[]
    for (s,e),(clip,_) in zip(sentences_t,clipseq):
        d=e-s
        if d>6.0:
            m=s+d/2; shots.append((s,m,clip,0)); shots.append((m,e,clip,4.0))
        else: shots.append((s,e,clip,0))
    return shots
for bi,sb in enumerate(S,1):
    bw,btext=words(f'b{bi}',0)
    # sentence boundaries in body text
    sents=sb['body']+sb['cta']
    # map word index -> sentence by counting words
    idx=0;sent_rng=[]
    for sn in sents:
        n=len(sn.split()); sent_rng.append((idx,idx+n)); idx+=n
    assert idx==len(bw),(idx,len(bw))
    bdur=mp3dur(f'vo/b{bi}.mp3')
    for h in range(1,6):
        hid=f'b{bi}h{h}'
        hd=mp3dur(f'vo/{hid}.mp3')
        off=hd+GAP
        hw,_=words(hid,0)
        bwo=[dict(w['__class__'] if False else w) for w in bw]
        for w in bwo: w['s']+=off; w['e']+=off
        total=off+bdur+0.7
        # shots: hook then body sentences
        shots=[(0,off,HOOKCLIP[bi][h],0)]
        first=True
        for k,(a,b) in enumerate(sent_rng):
            s=bwo[a]['s'] if k>0 else off
            e=bwo[b]['s'] if b<len(bwo) else total
            clip,_=BODY[bi][k]
            d=e-s
            if d>6.0:
                m=s+d/2; shots+= [(s,m,clip,0),(m,e,clip,4.0)]
            else: shots.append((s,e,clip,0))
        # avoid same clip consecutively without variety: nothing needed
        callouts=[]
        for k,(a,b) in enumerate(sent_rng):
            s=bwo[a]['s']; e=bwo[b-1]['e']
            callouts.append(dict(text=BODY[bi][k][1],s=s+0.15,e=min(s+3.2,e+0.6),cta=(k==len(sent_rng)-1)))
        # audio mix
        spacer=f'audio/sil_{GAP}.mp3'
        mix=f'audio/{hid}.mp3'
        if not os.path.exists(mix):
            fc=(f"[0:a][1:a][2:a]concat=n=3:v=0:a=1,apad=whole_dur={total:.3f}[v];"
                f"[v]asplit[v1][v2];[3:a]volume=0.55,atrim=0:{total:.3f},afade=t=in:d=1.5,afade=t=out:st={total-2.5:.3f}:d=2.5[m];"
                f"[m][v2]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=500:makeup=1[md];"
                f"[v1][md]amix=inputs=2:normalize=0,alimiter=limit=0.95")
            subprocess.run(['ffmpeg','-v','error','-y','-i',f'vo/{hid}.mp3','-f','lavfi','-t',str(GAP),'-i','anullsrc=r=44100:cl=mono','-i',f'vo/b{bi}.mp3','-i','music/stem.mp3','-filter_complex',fc,'-t',f'{total:.3f}','-ar','44100','-b:a','192k',mix],check=True)
        props=dict(id=hid,title=f'Body {bi} Hook {h}',fps=FPS,duration=round(total*FPS),hookEnd=off,
            audio=f'audio/{hid}.mp3',words=[dict(w,hook=True) for w in hw]+[dict(w,hook=False) for w in bwo],
            shots=[dict(s=a,e=b,clip=c,off=o) for a,b,c,o in shots],callouts=callouts,body=bi,hookIndex=h)
        json.dump(props,open(f'props/{hid}.json','w'),ensure_ascii=False,indent=1)
        print(hid,round(total,1),len(shots))
