Det här är min lekmans-analys av RC-projektet.

Jag tror att vår prototyp kan göra *en* intressant sak, men den saken har inget med Reservoir Computing att göra. Vi synkar scennoder över flera mobiler. Vi delar upp beräkningen så att en enhet hanterar några noder medan en annan hanterar andra. Resultatet blir att vi kan ha en enhetlig upplevelse i AR.

(Detta är om det alls fungerar.)

Reservoaren skulle kunna användas för att “intelligent” justera arbetsbördan. Om en enhet har en långsam processor, eller ont om minne, kanske den inte hinner utföra sin uppgift med tillräckligt hög frekvens. Då skulle den kanske få hantera färre noder. Och om det är en enhet som har högre prestanda än övriga, kan den tilldelas extra noder.

Resultatet kan bli att individuella enheter drar lite mindre energi. Men det kan också betyda att RC:ns egna beräkningar kostar energi. Om den kostnaden är mindre än det vi vinner på att dela upp beräkningen kan det vara värdefullt för individuella enheter.

(Om vi till exempel ofta måste starta och stoppa GPU:n kostar det mycket energi och då är det bättre att använda CPU istället.)


Ijag4897