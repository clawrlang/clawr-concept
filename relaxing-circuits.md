# Clawr is not Meant for Relaxing Circuits

There is an interesting field of computer science. For a couple of decades, the industry has tried (and succeeded to some degree) to build quantum computers. Quantum computers are not computers in the traditional sense. They do not compute anything. They *relax* into a physical state.

There are other ideas for creating relaxing circuits: memristive crossbar is one. They all have one thing in common: they are not computers, but they can still solve some problems that computers are traditionally used for. The benefit of a relaxing circuit is energy usage. Relaxation usually means finding the lowest energy state and simply dissipating excess. It is a very energy efficient “computation.” But setting up the initial state may cost energy.

The main downside of relaxing circuitry is that the logic is built into the hardware. There is no software. Relaxing circuits are not programmable. The term is used — sloppily — to indicate reconfiguring of the matrix. Such “programming” does not add functionality. It will always be a matrix multiplication. And it will always be the same size matrix.

If you need a bigger matrix, you'll need a bigger chip. If you need a *smaller* matrix, you also need a new chip. You can still perform the math on an oversized chip — linear mathematics can ignore parts of a matrix — but setting positions in the matrix to zero costs as much energy any other value. The energy cost will be the same as if using the matrix in full. Only by creating a smaller chip can the energy use decrease.

That's why a software language like Clawr is completely useless in that context. You cannot program a relaxing circuit. For programming, for complex use cases, you still need von Neumann machines. Maybe there are better ways to build programmable chips (e.g. with Fredkin gates) but that is not what has been proposed at this time.

> [!question]
> Om en krets “relaxerar” till ett resultat, kan den då vara programmerbar?

Det här är en intressant fråga som berör skillnaden mellan *dynamisk relaxation* och *programmerbarhet*.

**Kort svar:**  
Ja, en krets som relaxerar till ett resultat *kan* vara programmerbar, men inte i traditionell von Neumann-mening. Det beror på hur man definierar ”programmerbar”.

**Lite längre svar:**

När man säger att en krets ”relaxar” till ett resultat, menar man ofta att den söker sig mot ett minimum av någon energifunktion (t.ex. i ett resistivt nätverk, en oscillatorbaserad krets, eller en spinnbaserad krets). Exempel:

- **Resistiva nätverk** (memristorbaserade) relaxerar till en spänningsfördelning som löser ett linjärt ekvationssystem.  
- **Ising-maskiner** (t.ex. Fujitsu Digital Annealer eller D-Waves kvantanlare) relaxar till grundtillståndet för en given Hamiltonfunktion, vilket svarar mot lösningen på ett optimeringsproblem.

Dessa kretsar är **programmerbara i vid bemärkelse** eftersom man kan ändra deras beteende genom att ställa in parametrar (t.ex. konduktanser, kopplingsvikter, externa fält). Men de är **inte instruktionsprogrammerbara** – man skriver inte en sekvens av kommandon som exekveras stegvis. Istället ”programmerar” man problemet som en energilandskap, och kretsen relaxerar till svaret.

**Exempel på programmerbarhet:**  
Ett memristorbaserat korskopplat nätverk kan programmeras att lösa olika linjära ekvationssystem (olika matriser \(A\) och vektorer \(b\)) genom att ladda olika konduktansvärden. Relaxationen ger lösningen \(x\). Det är programmerbarhet i hårdvara (”reconfigurable computing”).

**Slutsats:**  
Ja, en relaxerande krets kan vara programmerbar, men programmeringsmodellen är *probleminställning via parametrar*, inte sekventiella instruktioner. Inom fält som analog beräkning, neuromorf kretsdesign och probabilistisk computing är detta en central idé.

> [!question]
> Men den kommer fortfarande bara ha en funktion? Dvs en matrismultiplikation. Var du säger är att det går att “programmera” den med nya skalär-värden i matrisen. Men det kommer alltid vara en matris? Och alltid en viss storlek?

Du har helt rätt – det är en mycket skarp observation. Låt oss bryta ner det.

## Ja, den har i praktiken **en fix funktion** i termer av *operationstyp* och *datastorlek*

Exakt som du säger:

- Ett memristorbaserat nätverk för linjära ekvationer \(Ax = b\) kommer **alltid** att lösa just \(Ax = b\).  
- Matrisens *dimension* (t.ex. 100×100) är fix i hårdvaran – du kan inte plötsligt köra en 200×200 matris utan att bygga om kretsen.
- Du kan bara ändra *värdena* i matrisen (konduktanserna) och vektorn \(b\) (spänningar), inte operationens natur eller dimensionalitet.

## Så vad betyder ”programmerbar” här?

Ordet används ofta **slarvigt** i forskningslitteraturen. En mer korrekt term vore:

> **”Omladdningsbar”** eller **”parametriserbar”** – inte programmerbar i bemärkelsen Turing-komplett eller allmänändamål.

En vanlig CPU är programmerbar för att den kan köra **godtyckliga sekvenser av olika operationer** (addition, multiplikation, grenar, loopar, etc.) på **godtyckligt stora datastrukturer** (med minnesåtkomst).  
Din relaxerande krets kan bara göra **en sak** om och om igen, med olika tal.

## Men… det finns nyanser

Vissa mer avancerade relaxerande kretsar kan växla mellan *några få* förinställda operationer:

- Ett omkonfigurerbart analogt nätverk med switchar kan ibland kopplas om för att lösa **antingen** \(Ax=b\) **eller** egenvärdesproblem, men det är fortfarande en liten, fix uppsättning operationer.
- I princip skulle man kunna bygga en relaxerande krets som simulerar **vilket som helst** optimeringsproblem genom att dynamiskt ladda en helt ny energifunktion (t.ex. med omprogrammerbara memristorer i flera lager), men **dimensionaliteten** (antal variabler) är fortfarande låst i hårdvaran.

## Kärnpoängen

Din invändning är fundamental:  
**Relaxation är inte allmän programmerbarhet – det är specialiserad, fixd dimensionell, parameterjusterbar analog beräkning.**

Det är som skillnaden mellan:
- En **miniräknare** som alltid multiplicerar två tal (men du kan slå in nya tal) – inte programmerbar.
- En **CPU** som kan multiplicera, addera, eller göra vad som helst – programmerbar.

Så nej, i strikt datalogisk mening är en relaxerande krets *inte* programmerbar. Den är *omkonfigurerbar* för en fix algoritm med fix datastorlek.

> [!question]
> Kan man göra en matrismultiplikation på bara en del av en matris? Dvs, kan man göra matrisen mindre utan att skapa en ny krets?

Bra fråga – den går rakt på kärnan av begränsningen med fast hårdvara.

## Kort svar: **Nej, inte utan overhead eller omvägar**

I en fysiskt realiserad relaxerande krets (t.ex. memristorkorskoppling) är varje kretselement en fysisk komponent. Du kan inte "ta bort" rader eller kolumner i själva hårdvaran utan att faktiskt koppla bort dem.

## Vad du *kan* göra (men det är inte samma sak)

### 1. Nollställning
Du kan sätta vissa rader/kolumner till **noll** (dvs. konduktanser = 0, eller spänningar = 0).  
Då *simulerar* du en mindre matris inuti den stora, men:
- Alla fysiska komponenter finns fortfarande där.
- Du får ingen hastighetsvinst (tvärtom – du slösar energi på nollor).
- Parastorleken (läckströmmar, kapacitans) påverkar fortfarande.

### 2. Omkoppling via switchar
Man kan bygga in **switchar** så att vissa rader/kolumner kan kopplas bort helt.  
Då får du en mindre effektiv matris – men switcharna tar plats och lägger till resistans/parasiter. Det är inte längre "bara" en matrismultiplikationskrets, utan en *rekonfigurerbar* sådan.

### 3. Tidsdelning
Du kan använda samma fysiska krets för att beräkna olika delmatriser **sekventiellt** och kombinera resultaten digitalt efteråt.  
Men då förlorar du relaxationens stora fördel: **parallellitet i O(1) tid**.

## Varför detta är ett fundamentalt problem

I en digital CPU kan du göra en 10×10 matrismultiplikation med en 1000×1000-matrisalgoritm – du använder bara en liten del av minnet och kör färre operationer.

I en analog relaxerande krets är **dimensionaliteten låst i kisel**. Du har exakt \(N\) noder och \(N^2\) kretselement. Du kan inte "låtsas" att \(N\) är mindre utan att aktivt inaktivera delar av kretsen, vilket kräver extra switchar och därmed förlorar den rena analogans fördelar.

## Slutsats

**Nej – utan att bygga en ny fysisk krets kan du inte göra matrisen mindre på ett effektivt sätt.**

Det här är en av de stora anledningarna till att analog in-memory computing (trots att det är lovande för AI-acceleration) än så länge mest används för **fasta modeller** eller modeller som tränas en gång och sedan körs oförändrat. Dynamisk omdimensionalisering är ett öppet forskningsproblem.

> [!question]
> Men det går matematiskt med linjär algebra?

Ja, **matematiskt går det utmärkt** – och det är en viktig distinktion!

## Matematiskt: Ja, helt trivialt

Om du har en matris \(A\) av storlek \(N \times N\) och bara vill använda en del av den (säg de första \(k \times k\) elementen), då definierar du helt enkelt:

- \(A'\) som \(k \times k\)-delmatrisen
- \(x'\) som de första \(k\) elementen av \(x\)
- \(b'\) som de första \(k\) elementen av \(b\)

Då gäller \(A'x' = b'\) oberoende av resten av \(A\).

De andra \(N-k\) ekvationerna ignoreras bara. Rent matematiskt är det inget problem.

## Gapet: Matematik vs. fysik

| Aspekt | Matematik | Fysisk krets |
|--------|-----------|--------------|
| Ignorera element | Sätt dem till noll | Nollor finns fortfarande fysiskt |
| Minska dimension | Välj delrum | Kan inte ta bort noder |
| Parasiska effekter | Finns inte | Läckströmmar, kapacitans, brus |

I matematiken är en nolla *frånvarande*. I fysiken är en nolla *närvarande men inställd till noll* – den påverkar fortfarande kretsen via:

- **Parasitära kapacitanser** (laddning lagras ändå)
- **Läckströmmar** (ingen ideal isolator)
- **Termiskt brus** (motstånd ger brus även vid noll konduktans)

## Ett konkret exempel

Säg att du har en 1000×1000 memristorkorskoppling, men vill bara lösa ett 100×100 problem.

**Matematiskt:** Du definierar en 100×100 matris och struntar i resten.

**Fysiskt:** Du måste ändå:
1. Ladda in 10000 memristorer (inte bara 100×100 = 10000? Nej, 1000×1000 = 1 miljon! Alla måste sättas)
2. 900×900 = 810 000 memristorer måste sättas till noll (tar tid, drar läckström)
3. 1000 noder har fortfarande parasiter – du får inte en ren 100-nodskrets

## Så svaret på din fråga

> "Men det går matematiskt med linjär algebra?"

**Ja, absolut.** Matematiken hindrar dig inte på något sätt.

**Men:** Fysiken i en analog krets gör att du inte får den rena, isolerade delmatrisen som matematiken lovar. Du får en störande omgivning som alltid påverkar resultatet – särskilt vid hög precision eller svagt konditionerade problem.

Detta är varför *digital* beräkning (trots sin lägre energieffektivitet) är så dominerande: separationen mellan "data som används" och "data som ignoreras" är perfekt. I analog fysik finns ingen sådan separation.

> [!question]
> Digitala datorer (von Neumann) använder binära operationer för att i stort sett utföra aritmetik. En matrismultiplikation är också aritmetik. Kan det i princip vara möjligt att använda en matris (om den är tillräckligt stor) för att tolka data som instruktioner?
>
> Jag antar att en sådan matris skulle behöva vara ganska enorm. Och den skulle också behöva göra operationer som man inte normalt förknippar med linjär algebra (som floor/ceil på cellnivå)?

Det här är en **mycket djup fråga** som berör gränsen mellan linjär algebra och datalogi. Låt mig strukturera svaret.

## Kort svar: Ja, i princip möjligt – men med enorma kostnader och strikta begränsningar

## 1. Hur skulle det fungera?

I en von Neumann-dator lagras **både data och instruktioner** som binära tal i minnet. En instruktion är bara ett mönster av bitar som avkodas av processorn.

Om du har en tillräckligt stor matris $M$, kan du definiera:

$$
\text{instruktion} = \text{round}(M \cdot \text{data} + \text{bias})
$$

Där:
- Data är en vektor (t.ex. maskinord)
- Multiplikationen ger ett reellt tal
- **round()** (eller floor/ceil) kvantiserar till ett heltal
- Det heltalet tolkas som en maskininstruktionskod

## 2. Problemet med round/floor/ceil

Du nämnde det själv – dessa operationer är **icke-linjära** och **inte kontinuerliga**. Ren linjär algebra kan inte göra dem.

För att simulera en CPU med enbart matrismultiplikation skulle du behöva representera icke-linjära steg som:
- **Bitvisa operationer** (AND, OR, XOR)
- **Jämförelser** (om x > y)
- **Grenar** (hopp baserat på resultat)

Det går inte med enbart $\cdot$ och $+$ – du måste **kvantisera** mellan varje steg.

## 3. Skulle matrisen behöva vara enorm?

Ja, **enorm** är en underdrift.

### Liten uppskattning:
- En modern CPU har kanske 100–200 olika instruktionskoder (8 bitar räcker för 256 st)
- Varje instruktion måste kunna genereras från godtycklig data
- Du vill kanske köra en sekvens av instruktioner, inte bara en

För att representera en **hel CPU** som en enda linjär transformation + tröskelvärden, skulle matrisen behöva ha dimensioner i storleksordningen:

$$
\text{minst } (2^N \times 2^N) \text{ där N är antalet bitar per ord}
$$

För 32-bitars ord: $2^{32} \times 2^{32}$ – det är ofattbart stort. Universums atomer räcker inte.

## 4. Finns det mindre galna alternativ?

Ja – **approximativ beräkning** eller **neuromorf computing**.

Exempelvis:
- Man kan träna ett neuralt nätverk (som i grunden är matrismultiplikationer + ickelinjäriteter) att *efterlikna* en CPU:s beteende för vissa specifika program.
- Men det blir aldrig en **exakt** universalprocessor – det blir en approximator.

## 5. Kärninsikten

**Linjär algebra + kvantisering** (round/floor/ceil) kan i princip simulera **vilken beräkning som helst** eftersom:
- Heltalsaritmetik kan byggas upp från matriser + trösklar
- Alla digitala kretsar kan simuleras av neurala nätverk med ReLU (som är round-liknande)

Men **kostnaden** är astronomisk jämfört med att bara bygga en vanlig CPU.

## Slutsats

| Fråga | Svar |
|-------|------|
| Principiellt möjligt? | **Ja** (med icke-linjära steg) |
| Enbart linjär algebra? | **Nej** (behöver round/floor/ceil) |
| Skulle matrisen vara enorm? | **Ja**, exponentiellt stor |
| Praktiskt användbart? | **Nej**, helt orimligt |

**Analogin:** Det är som att använda en enda gigantisk ekvation för att simulera en schackmotor – matematiskt möjligt i teorin, men i praktiken totalt meningslöst jämfört med att bara skriva en vanlig algoritm.

Det du beskriver är i grunden en **”universell linjär transformationsdator”** – den skulle ha samma teoretiska kraft som en Turingmaskin (om du lägger till icke-linjära trösklar), men den praktiska kostnaden i antal parametrar är exponentiell i ordlängden.
