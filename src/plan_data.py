# -*- coding: utf-8 -*-
"""
Planta medida directamente sobre 1790420623635_image.png (1113x639 px).
Todas las coordenadas estan en PIXELES del plano y se convierten a metros
con la escala calibrada con las superficies interiores (75.3 px/m).
x -> derecha, y -> abajo (igual que la imagen).
"""
import json, math

S = 75.3            # px por metro
OX, OY = 25, 41     # origen (esquina exterior NO aprox.)

H_INT, H_PAR, H_DOOR = 2.60, 1.05, 2.10

# ---------------------------------------------------------------- estancias
ROOMS = [
  dict(id='vestibulo', label='Vestíbulo', m2=2.25, floor='tile',
       poly=[(104,45),(269,45),(269,135),(104,135)]),
  dict(id='salon', label='Salón-Comedor', m2=18.40, floor='wood',
       poly=[(269,45),(514,45),(514,453),(244,453),(244,135),(269,135)]),
  dict(id='cocina', label='Cocina', m2=7.65, floor='tile',
       poly=[(104,135),(198,135),(198,180),(244,180),(244,453),(67,453),(67,277),(104,277)]),
  dict(id='distribuidor', label='Distribuidor', m2=2.40, floor='wood',
       poly=[(514,45),(587,45),(587,253),(514,253)]),
  dict(id='bano2', label='Baño 2', m2=3.75, floor='marble',
       poly=[(587,45),(761,45),(761,179),(587,179)]),
  dict(id='bano1', label='Baño 1', m2=4.40, floor='marble',
       poly=[(793,45),(928,45),(928,252),(790,252),(790,179),(793,179)]),
  dict(id='dorm2', label='Dormitorio 2', m2=10.25, floor='wood',
       poly=[(514,253),(590,253),(590,300),(714,300),(714,594),(507,594),(507,453),(514,453)]),
  dict(id='dorm1', label='Dormitorio 1', m2=15.40, floor='wood',
       poly=[(587,179),(790,179),(790,252),(928,252),(928,298),(933,298),(1015,385),
             (806,594),(714,594),(714,300),(590,300),(590,253),(587,253)]),
  dict(id='tendedero', label='Tendedero', m2=3.00, floor='outdoor', terrace=True,
       poly=[(30,453),(170,453),(170,600),(30,600)]),
  dict(id='terraza', label='Terraza', m2=7.60, floor='outdoor', terrace=True,
       poly=[(170,453),(507,453),(507,600),(170,600)]),
  dict(id='terraza_d1', label='Terraza dorm.', m2=2.60, floor='outdoor', terrace=True,
       poly=[(938,170),(1089,319),(1020,385),(1015,385),(933,298),(938,298)]),
]

# ---------------------------------------------------------------- muros
# a,b: extremos del eje (px). t: espesor (px). h: altura (m).
# o: huecos. s,e = px a lo largo del muro desde 'a'.
#    kind: door | glassdoor | window | glass
#    hinge: 'start'|'end' (lado de la bisagra)   into: punto (px) de la estancia hacia la que abre
def W(a,b,t,h=H_INT,o=None,note=''):
    return dict(a=a,b=b,t=t,h=h,o=o or [],note=note)

WALLS = [
  # ---------- fachada norte (sin huecos)
  W((96,45.5),(938,45.5),9, note='fachada norte'),

  # ---------- fachada oeste: vestibulo con la PUERTA DE ENTRADA (pared vertical)
  W((104.5,41),(104.5,277),17, note='oeste vestibulo/cocina',
    o=[dict(s=16,e=79,kind='door',hinge='start',into=(160,90))]),      # y 57..120
  W((64,277),(113,277),16, note='quiebro cocina'),
  W((67.5,277),(67.5,453),7, note='oeste cocina'),

  # ---------- vestibulo / cocina (puerta de cocina en pared horizontal)
  W((113,135),(198.5,135),6, note='vestibulo-cocina',
    o=[dict(s=11,e=68,kind='door',hinge='start',into=(150,200))]),     # x 124..181
  W((198.5,132),(198.5,183),7, note='armario vestibulo (lado cocina)'),
  W((195,180),(247,180),6, note='armario vestibulo (fondo)'),
  W((244,132),(244,453),6, note='cocina-salon'),

  # ---------- sur cocina / tendedero / salon
  W((25,453.5),(247,453.5),19, note='cocina-tendedero',
    o=[dict(s=75,e=131,kind='door',hinge='end',into=(128,520))]),      # x 100..156
  W((241,453.5),(517,453.5),19, note='salon-terraza',
    o=[dict(s=23,e=135,kind='glass'),                                   # ventanal x 264..376
       dict(s=163,e=229,kind='glassdoor',hinge='end',into=(430,400))]), # puerta x 404..470

  # ---------- tendedero y terraza
  W((30,453),(30,603),10,H_PAR, note='peto oeste tendedero'),
  W((25,600),(498,600),6,H_PAR, note='peto sur terrazas'),
  W((170.5,463),(170.5,603),19, note='separacion tendedero/terraza'),
  W((507.5,463),(507.5,603),19, note='terraza-dormitorio 2'),

  # ---------- salon / distribuidor / dormitorio 2
  W((514,45),(514,463),6, note='salon-distribuidor-dorm2',
    o=[dict(s=12,e=66,kind='door',hinge='start',into=(550,90))]),      # y 57..111

  # ---------- distribuidor -> bano 2 y -> dormitorio 1 (dos puertas en la misma pared)
  W((587,45),(587,253),6, note='distribuidor-banos/dorm1',
    o=[dict(s=72,e=121,kind='door',hinge='end',into=(640,140)),        # bano 2  y 117..166
       dict(s=144,e=198,kind='door',hinge='start',into=(640,215))]),   # dorm 1  y 189..243
  W((514,253),(590,253),6, note='distribuidor-dorm2',
    o=[dict(s=12,e=70,kind='door',hinge='start',into=(555,300))]),     # x 526..584

  # ---------- banos
  W((587,179.5),(790,179.5),7, note='sur bano 2'),
  W((777,45),(777,176),32, note='MURO GRUESO entre banos'),
  W((790,176),(790,253),6, note='bano1 oeste',
    o=[dict(s=14,e=67,kind='door',hinge='end',into=(840,215))]),       # y 190..243
  W((787,252.5),(928,252.5),7, note='sur bano 1'),

  # ---------- fachada este
  W((928.5,41),(928.5,298),19, note='fachada este',
    o=[dict(s=75,e=122,kind='window',sill=1.10,top=2.00)]),            # ventana bano1 y 116..163

  # ---------- dormitorio 1 <-> terraza (acristalado con puerta)
  W((933,298),(1012,385),8, note='ventanal dormitorio 1',
    o=[dict(s=8,e=30,kind='glass'),
       dict(s=30,e=110,kind='glassdoor',hinge='end',into=(900,340))]),
  W((938,170),(1089,319),5,H_PAR, note='peto terraza'),
  W((1089,319),(1020,385),5,H_PAR, note='peto terraza'),

  # ---------- fachada SE (cabecero, sin ventana) y sur
  W((1015,385),(806,594),14, note='fachada SE (cabecero)'),
  W((498,593.5),(810,593.5),19, note='fachada sur dormitorios',
    o=[dict(s=74,e=198,kind='window',sill=0.90,top=2.20)]),            # ventana dorm2 x 572..696

  # ---------- dormitorio 1 / dormitorio 2
  W((714,250),(714,594),6, note='dorm1-dorm2'),
]

# ---------------------------------------------------------------- armarios / pilares
# x0,y0,x1,y1 (px), h (m), front: lado por el que se abre
CLOSETS = [
  dict(r=(201,133,241,177), h=2.20, kind='closet', note='armario vestibulo'),
  dict(r=(590,253,711,299), h=H_INT, kind='closet', note='armario dormitorio 1 (en el pasillo del dormitorio)'),
  dict(r=(590,301,711,347), h=H_INT, kind='closet', note='armario dormitorio 2'),
  dict(r=(717,537,801,584), h=2.20, kind='closet', note='armario dormitorio 1'),
  dict(r=(486,418,511,450), h=H_INT, kind='pillar', note='pilar salon'),
]

# ---------------------------------------------------------------- conversion
def m(p): return [round((p[0]-OX)/S,4), round((p[1]-OY)/S,4)]
def to_meters():
    rooms=[dict(id=r['id'],label=r['label'],m2=r['m2'],floor=r['floor'],
                terrace=r.get('terrace',False),poly=[m(p) for p in r['poly']]) for r in ROOMS]
    walls=[]
    for w in WALLS:
        ops=[]
        for o in w['o']:
            q=dict(o); q['s']=round(o['s']/S,4); q['e']=round(o['e']/S,4)
            if 'into' in o: q['into']=m(o['into'])
            ops.append(q)
        walls.append(dict(a=m(w['a']),b=m(w['b']),t=round(w['t']/S,4),h=w['h'],o=ops,note=w['note']))
    closets=[]
    for c in CLOSETS:
        x0,y0,x1,y1=c['r']; a=m((x0,y0)); b=m((x1,y1))
        closets.append(dict(a=a,b=b,h=c['h'],kind=c['kind'],note=c['note']))
    return dict(rooms=rooms,walls=walls,closets=closets,H_INT=H_INT,H_DOOR=H_DOOR)

def area(poly):
    s=0
    for i in range(len(poly)):
        x1,y1=poly[i]; x2,y2=poly[(i+1)%len(poly)]; s+=x1*y2-x2*y1
    return abs(s)/2

if __name__=='__main__':
    D=to_meters()
    json.dump(D,open('plan.json','w'),ensure_ascii=False,indent=1)
    for r in D['rooms']:
        print(f"{r['label']:22s} eje {area(r['poly']):6.2f} m2   plano {r['m2']:5.2f}")
    print('walls',len(D['walls']),'closets',len(D['closets']))
