// Neighborhood data for SEO landing pages.
// Consumed by scripts/generate-neighborhood-pages.mjs which emits trilingual
// static HTML into public/neighborhoods/{slug}/, public/es/neighborhoods/{slug}/,
// and public/zh/neighborhoods/{slug}/.
//
// See deliverable-2-neighborhood-template.md for the content classification
// (unique vs shared vs templated) and the Sunset reference content.

/** @type {import('./neighborhoods.d.ts').NeighborhoodData[]} */
export const neighborhoods = [
  {
    slug: "sunset",
    nameEn: "Sunset District",
    nameEs: "Distrito Sunset",
    nameZh: "Sunset",
    primaryLanguagesEn: ["Chinese (Cantonese)", "Chinese (Mandarin)", "English"],
    primaryLanguagesEs: ["Chino (Cantonés)", "Chino (Mandarín)", "Inglés"],
    primaryLanguagesZh: ["中文（粵語）", "中文（普通話）", "英語"],
    typicalAgeGroupsEn: "Infants (0–18 months), Toddlers (18 months–3 years), Preschool (3–5 years)",
    typicalAgeGroupsEs: "Bebés (0–18 meses), Niños pequeños (18 meses–3 años), Preescolar (3–5 años)",
    typicalAgeGroupsZh: "嬰兒（0–18個月）、幼兒（18個月–3歲）、學前兒童（3–5歲）",
    typicalHours: "Monday–Friday, 7:30 AM – 5:30 PM",
    transitNotes: "N-Judah, L-Taraval, 28-19th Ave, 29-Sunset",
    nearbyNeighborhoods: ["richmond", "visitacion-valley"],

    introEn:
      "The Sunset District is home to one of the highest concentrations of licensed family child care homes in San Francisco, with many providers offering bilingual care in Cantonese, Mandarin, and English. The neighborhood's residential character — quiet blocks, proximity to Golden Gate Park, and strong public transit along the N-Judah and L-Taraval lines — makes it a natural fit for home-based child care. Many Sunset family child care providers participate in the ELFA network, meaning most families in this neighborhood can access free or reduced-cost care. Whether you are looking for infant care, toddler spots, or a bilingual preschool-age program, the Sunset has more family child care options per block than almost any other San Francisco neighborhood.",
    introEs:
      "El Distrito Sunset alberga una de las mayores concentraciones de hogares de cuidado infantil familiar con licencia en San Francisco, con muchos proveedores que ofrecen cuidado bilingüe en cantonés, mandarín e inglés. El carácter residencial del barrio — calles tranquilas, proximidad al Golden Gate Park y buen transporte público a lo largo de las líneas N-Judah y L-Taraval — lo hace ideal para el cuidado infantil en el hogar. Muchos proveedores del Sunset participan en la red ELFA, por lo que la mayoría de familias pueden acceder a cuidado gratuito o a bajo costo. Ya sea que busque cuidado para bebés, plazas para niños pequeños, o un programa bilingüe preescolar, el Sunset tiene más opciones de cuidado familiar por cuadra que casi cualquier otro barrio de San Francisco.",
    introZh:
      "Sunset（Sunset District）擁有全三藩市（舊金山）最密集的持牌家庭托兒所之一，許多托兒者提供粵語、普通話及英語的雙語照護。此社區環境寧靜、近金門公園，並有N-Judah及L-Taraval等便利公共交通，非常適合家庭式托兒。Sunset多家家庭托兒所參加全民早期教育計劃 (ELFA) 網絡，大部分家庭均可獲得免費或減費托兒服務。無論您在尋找嬰兒托兒、幼兒名額，或雙語學前教育計劃，Sunset的家庭托兒所選擇是全市最多的。",

    fccDescriptionEn:
      "Family child care homes in the Sunset typically serve mixed-age groups of up to 8 children (small FCC) or up to 14 children (large FCC), with a home-like environment that many families prefer for infants and toddlers. Providers in this area commonly offer full-day care from approximately 7:30 AM to 5:30 PM, Monday through Friday, though hours vary by provider. The Sunset's family child care homes often reflect the neighborhood's strong Chinese-American community. Cantonese is the most commonly spoken second language among providers here, followed by Mandarin. Many providers also serve English-speaking families in a bilingual or English-primary setting. Meals and daily routines frequently incorporate Chinese cultural practices, including home-cooked meals with traditional ingredients.",
    fccDescriptionEs:
      "Los hogares de cuidado infantil familiar en el Sunset generalmente atienden a grupos de edades mixtas de hasta 8 niños (FCC pequeño) o hasta 14 niños (FCC grande), con un ambiente hogareño que muchas familias prefieren para bebés y niños pequeños. Los proveedores en esta área comúnmente ofrecen cuidado de día completo aproximadamente de 7:30 AM a 5:30 PM, de lunes a viernes, aunque las horas varían según el proveedor. Los hogares del Sunset a menudo reflejan la fuerte comunidad chino-americana del barrio. El cantonés es el segundo idioma más hablado entre los proveedores aquí, seguido del mandarín. Muchos proveedores también atienden a familias de habla inglesa en un entorno bilingüe o principalmente en inglés. Las comidas y rutinas diarias frecuentemente incorporan prácticas culturales chinas, incluyendo comidas caseras con ingredientes tradicionales.",
    fccDescriptionZh:
      "Sunset的家庭托兒所通常照顧混合年齡組最多8名兒童（小型FCC）或最多14名兒童（大型FCC），提供家庭式環境，許多家庭偏好為嬰幼兒選擇此類環境。本區托兒者通常提供週一至週五7:30 AM至5:30 PM的全日托兒服務，具體時間因托兒者而異。Sunset的家庭托兒所充分反映社區強大的華人美裔社群。粵語是本區托兒者最常使用的第二語言，其次為普通話。許多托兒者也以雙語或英語為主的環境服務英語家庭。膳食及日常活動經常融入中國文化元素，包括以傳統食材烹調的家常菜。",

    bilingual: {
      languageEn: "Chinese",
      languageEs: "Chino",
      languageZh: "中文",
      contentEn:
        "The Sunset District has the highest density of Chinese-speaking family child care providers in San Francisco. For families who want their child to grow up hearing Cantonese or Mandarin alongside English, this neighborhood offers something few center-based programs can match: daily immersion in a bilingual home environment where the provider's native language is woven into meals, play, songs, and conversation throughout the day. This is not the same as a 'bilingual curriculum' at a large center. In a Sunset family child care home, a Cantonese-speaking provider may read stories in Cantonese, cook Chinese meals with the children, celebrate Lunar New Year and Mid-Autumn Festival as part of the daily rhythm, and communicate with Chinese-speaking grandparents who do pick-up and drop-off. For families maintaining heritage language at home, this continuity is hard to replicate elsewhere.",
      contentEs:
        "El Distrito Sunset tiene la mayor densidad de proveedores de cuidado infantil familiar de habla china en San Francisco. Para las familias que desean que su hijo crezca escuchando cantonés o mandarín junto al inglés, este barrio ofrece algo que pocos programas centralizados pueden igualar: inmersión diaria en un entorno bilingüe en el hogar donde el idioma nativo del proveedor se integra en las comidas, el juego, las canciones y la conversación durante todo el día. Esto no es lo mismo que un 'plan bilingüe' en un centro grande. En un hogar FCC del Sunset, un proveedor de habla cantonesa puede leer cuentos en cantonés, cocinar comidas chinas con los niños, celebrar el Año Nuevo Lunar y el Festival del Medio Otoño como parte del ritmo diario, y comunicarse con los abuelos de habla china que hacen la recogida y dejada. Para las familias que mantienen el idioma de herencia en casa, esta continuidad es difícil de replicar en otros lugares.",
      contentZh:
        "Sunset擁有全三藩市密度最高的華語家庭托兒所。對於希望孩子在成長過程中同時接觸粵語或普通話與英語的家庭來說，本社區提供了大多數中心式計劃無法比擬的條件：每天沉浸於雙語家庭環境，托兒者的母語自然融入膳食、遊戲、歌曲及對話之中。這與大型中心的「雙語課程」截然不同。在Sunset的家庭托兒所，粵語托兒者可能以粵語講故事、與孩子一起烹調中式膳食、將農曆新年和中秋節納入日常節奏、並用中文與負責接送的祖父母溝通。對於在家維持母語的家庭而言，這種延續性難以在其他地方複製。",
      directAnswerQuestionEn: "Where can I find Chinese bilingual daycare in the Sunset?",
      directAnswerQuestionEs: "¿Dónde puedo encontrar cuidado infantil bilingüe en chino en el Sunset?",
      directAnswerQuestionZh: "在Sunset哪裡可以找到中文雙語托兒服務？",
      directAnswerTextEn:
        "The Sunset District has dozens of licensed family child care homes where Cantonese or Mandarin is spoken daily alongside English. Many of these providers participate in San Francisco's ELFA subsidy network, so bilingual care can be free or low-cost for most families. Use FamilyChildcareSF.com to search current openings in the Sunset filtered by Chinese language.",
      directAnswerTextEs:
        "El Distrito Sunset tiene docenas de hogares FCC con licencia donde se habla cantonés o mandarín diariamente junto al inglés. Muchos de estos proveedores participan en la red de subsidios ELFA de San Francisco, por lo que el cuidado bilingüe puede ser gratuito o de bajo costo para la mayoría de las familias. Use FamilyChildcareSF.com para buscar aperturas actuales en el Sunset filtradas por idioma chino.",
      directAnswerTextZh:
        "Sunset有數十家持牌家庭托兒所日常以粵語或普通話配合英語授課。許多托兒者參加三藩市全民早期教育計劃 (ELFA) 補助網絡，大多數家庭可獲得免費或低費的雙語照護。請使用 FamilyChildcareSF.com 按中文語言篩選Sunset的當前空位。",
    },
  },

  {
    slug: "richmond",
    nameEn: "Richmond District",
    nameEs: "Distrito Richmond",
    nameZh: "Richmond",
    primaryLanguagesEn: ["Chinese (Cantonese)", "Chinese (Mandarin)", "Russian", "English"],
    primaryLanguagesEs: ["Chino (Cantonés)", "Chino (Mandarín)", "Ruso", "Inglés"],
    primaryLanguagesZh: ["中文（粵語）", "中文（普通話）", "俄語", "英語"],
    typicalAgeGroupsEn: "Infants (0–18 months), Toddlers (18 months–3 years), Preschool (3–5 years)",
    typicalAgeGroupsEs: "Bebés (0–18 meses), Niños pequeños (18 meses–3 años), Preescolar (3–5 años)",
    typicalAgeGroupsZh: "嬰兒（0–18個月）、幼兒（18個月–3歲）、學前兒童（3–5歲）",
    typicalHours: "Monday–Friday, 7:30 AM – 5:30 PM",
    transitNotes: "38-Geary, 38R-Geary Rapid, 1-California, 33-Ashbury/18th",
    nearbyNeighborhoods: ["sunset"],

    introEn:
      "The Richmond District is San Francisco's second-densest neighborhood for licensed family child care homes, with a distinctive mix of Chinese-speaking providers (primarily along Clement Street and Geary Boulevard) and Russian-speaking providers clustered near the Geary corridor. Quiet residential blocks, easy access to Golden Gate Park and the Presidio, and strong 38-Geary bus service make it a practical choice for working families. Many Richmond family child care homes participate in the ELFA network, which means most families in this neighborhood can access free or reduced-cost care. Whether you are looking for Cantonese immersion, Mandarin immersion, or Russian-speaking care for an infant or toddler, the Richmond offers deep neighborhood-level options that center-based programs rarely match.",
    introEs:
      "El Distrito Richmond es el segundo barrio más denso de San Francisco en hogares FCC con licencia, con una mezcla distintiva de proveedores de habla china (principalmente a lo largo de Clement Street y Geary Boulevard) y proveedores de habla rusa agrupados cerca del corredor Geary. Las calles residenciales tranquilas, el fácil acceso al Golden Gate Park y al Presidio, y el buen servicio de autobús 38-Geary lo convierten en una opción práctica para familias trabajadoras. Muchos hogares FCC del Richmond participan en la red ELFA, lo que significa que la mayoría de familias en este barrio pueden acceder a cuidado gratuito o a bajo costo. Ya sea que busque inmersión en cantonés, mandarín o cuidado de habla rusa para un bebé o niño pequeño, el Richmond ofrece opciones profundas a nivel de barrio que los programas centralizados rara vez igualan.",
    introZh:
      "Richmond（Richmond District）是三藩市（舊金山）家庭托兒所密度第二高的社區，擁有獨特的組合：以Clement街和Geary大道為主的華語托兒者，以及集中於Geary走廊的俄語托兒者。寧靜的住宅街區、鄰近金門公園與Presidio，加上38-Geary巴士服務便利，使其成為雙職家庭的實用選擇。Richmond多家家庭托兒所參加全民早期教育計劃 (ELFA) 網絡，大部分家庭均可獲得免費或減費托兒服務。無論您尋找粵語浸潤、普通話浸潤或俄語托兒（嬰兒或幼兒），Richmond均提供深厚的社區級選擇，通常是中心式計劃難以比擬的。",

    fccDescriptionEn:
      "Family child care homes in the Richmond typically serve mixed-age groups of up to 8 children (small FCC) or up to 14 children (large FCC) in a home environment. Most providers operate Monday through Friday from roughly 7:30 AM to 5:30 PM. Language diversity is the Richmond's distinguishing feature: Cantonese and Mandarin are most common in the Inner Richmond and along Clement Street, while Russian-speaking providers — serving families connected to the Russian community centered around Geary — offer a rare heritage-language option for infants and toddlers. Many providers cook meals onsite, and homes often reflect the cultural traditions of the provider family.",
    fccDescriptionEs:
      "Los hogares FCC en el Richmond generalmente atienden a grupos de edades mixtas de hasta 8 niños (FCC pequeño) o hasta 14 niños (FCC grande) en un ambiente hogareño. La mayoría de los proveedores operan de lunes a viernes aproximadamente de 7:30 AM a 5:30 PM. La diversidad lingüística es la característica distintiva del Richmond: el cantonés y el mandarín son más comunes en el Inner Richmond y a lo largo de Clement Street, mientras que los proveedores de habla rusa — que atienden a familias conectadas con la comunidad rusa centrada alrededor de Geary — ofrecen una opción poco común de idioma heredado para bebés y niños pequeños. Muchos proveedores cocinan comidas en el sitio, y los hogares a menudo reflejan las tradiciones culturales de la familia del proveedor.",
    fccDescriptionZh:
      "Richmond的家庭托兒所通常照顧混合年齡組最多8名兒童（小型FCC）或最多14名兒童（大型FCC），提供家庭式環境。大多數托兒者於週一至週五約7:30 AM至5:30 PM營業。語言多樣性是Richmond的顯著特點：粵語和普通話在內Richmond及Clement街最為常見，而俄語托兒者——服務以Geary為中心的俄裔社群家庭——為嬰幼兒提供罕見的母語選擇。許多托兒者在現場烹調膳食，家庭環境也經常反映托兒者家庭的文化傳統。",

    bilingual: {
      languageEn: "Chinese and Russian",
      languageEs: "Chino y Ruso",
      languageZh: "中文及俄語",
      contentEn:
        "The Richmond District offers a rare combination of Chinese and Russian bilingual family child care. For Chinese-speaking families, the Inner Richmond and Clement Street corridor host many Cantonese- and Mandarin-speaking providers whose homes naturally incorporate Chinese meals, songs, and cultural celebrations. For Russian-speaking families — a community historically underserved by English-dominant programs — the Geary corridor hosts providers who speak Russian daily with the children in their care. In both cases, the value is the same: heritage-language immersion from infancy, woven into daily life rather than delivered as a curriculum, and a cultural continuity that center-based programs cannot easily replicate.",
      contentEs:
        "El Distrito Richmond ofrece una combinación poco común de cuidado infantil familiar bilingüe en chino y ruso. Para las familias de habla china, el Inner Richmond y el corredor de Clement Street albergan a muchos proveedores de habla cantonesa y mandarina cuyos hogares incorporan naturalmente comidas chinas, canciones y celebraciones culturales. Para las familias de habla rusa — una comunidad históricamente desatendida por los programas dominados por el inglés — el corredor de Geary alberga a proveedores que hablan ruso diariamente con los niños a su cargo. En ambos casos, el valor es el mismo: inmersión en el idioma heredado desde la infancia, integrada en la vida diaria y no entregada como un plan de estudios, y una continuidad cultural que los programas centralizados no pueden replicar fácilmente.",
      contentZh:
        "Richmond提供罕見的中文與俄語雙語家庭托兒組合。對於華語家庭，內Richmond及Clement街走廊有許多粵語及普通話托兒者，家庭環境自然融入中式膳食、歌曲及文化節日。對於俄語家庭——一個長期被英語為主計劃忽略的社群——Geary走廊的托兒者每日以俄語與托管兒童溝通。兩種情況的價值相同：從嬰兒期開始的母語浸潤，融入日常生活而非當作課程，以及中心式計劃難以複製的文化延續性。",
      directAnswerQuestionEn: "Where can I find Cantonese, Mandarin, or Russian bilingual daycare in the Richmond?",
      directAnswerQuestionEs: "¿Dónde puedo encontrar cuidado infantil bilingüe en cantonés, mandarín o ruso en el Richmond?",
      directAnswerQuestionZh: "在Richmond哪裡可以找到粵語、普通話或俄語雙語托兒服務？",
      directAnswerTextEn:
        "The Richmond District has licensed family child care homes offering Cantonese and Mandarin bilingual care — concentrated in the Inner Richmond and along Clement Street — and Russian-speaking providers near the Geary corridor. Many participate in San Francisco's ELFA subsidy network, so bilingual care can be free or low-cost. Use FamilyChildcareSF.com to filter current openings by neighborhood and language.",
      directAnswerTextEs:
        "El Distrito Richmond tiene hogares FCC con licencia que ofrecen cuidado bilingüe en cantonés y mandarín — concentrados en el Inner Richmond y a lo largo de Clement Street — y proveedores de habla rusa cerca del corredor Geary. Muchos participan en la red de subsidios ELFA, por lo que el cuidado bilingüe puede ser gratuito o de bajo costo. Use FamilyChildcareSF.com para filtrar aperturas actuales por barrio e idioma.",
      directAnswerTextZh:
        "Richmond有持牌家庭托兒所提供粵語及普通話雙語照護——集中在內Richmond及Clement街——以及Geary走廊附近的俄語托兒者。許多托兒者參加三藩市全民早期教育計劃 (ELFA) 補助網絡，雙語照護可以免費或低費獲得。請使用 FamilyChildcareSF.com 按社區及語言篩選當前空位。",
    },
  },

  {
    slug: "excelsior",
    nameEn: "Excelsior District",
    nameEs: "Distrito Excelsior",
    nameZh: "Excelsior",
    primaryLanguagesEn: ["Spanish", "Chinese (Cantonese)", "Tagalog", "English"],
    primaryLanguagesEs: ["Español", "Chino (Cantonés)", "Tagalo", "Inglés"],
    primaryLanguagesZh: ["西班牙語", "中文（粵語）", "他加祿語", "英語"],
    typicalAgeGroupsEn: "Infants (0–18 months), Toddlers (18 months–3 years), Preschool (3–5 years), School-age",
    typicalAgeGroupsEs: "Bebés (0–18 meses), Niños pequeños (18 meses–3 años), Preescolar (3–5 años), Edad escolar",
    typicalAgeGroupsZh: "嬰兒（0–18個月）、幼兒（18個月–3歲）、學前兒童（3–5歲）、學齡兒童",
    typicalHours: "Monday–Friday, 7:00 AM – 6:00 PM",
    transitNotes: "14-Mission, 14R-Mission Rapid, 29-Sunset, 43-Masonic, Balboa Park BART",
    nearbyNeighborhoods: ["bayview", "mission"],

    introEn:
      "The Excelsior is one of San Francisco's most diverse and affordable neighborhoods, and its family child care landscape reflects that diversity. Spanish-speaking providers, Filipino (Tagalog) providers, and Cantonese-speaking providers are all concentrated here, serving families in a part of the city where center-based infant and toddler options are scarce. With close access to the 14-Mission bus line and Balboa Park BART, and a mix of single-family homes and small multi-unit buildings that work well for licensed home-based care, the Excelsior is a natural hub for family child care. Many providers participate in the ELFA network, making free or reduced-cost care available to most families. For parents looking for Spanish immersion, Tagalog-speaking care, or simply a neighborhood where their child will grow up hearing multiple languages, the Excelsior is often the answer.",
    introEs:
      "El Excelsior es uno de los barrios más diversos y asequibles de San Francisco, y su paisaje de cuidado infantil familiar refleja esa diversidad. Proveedores de habla hispana, proveedores filipinos (tagalo) y proveedores de habla cantonesa están todos concentrados aquí, atendiendo a familias en una parte de la ciudad donde las opciones centralizadas para bebés y niños pequeños son escasas. Con fácil acceso a la línea de autobús 14-Mission y al BART de Balboa Park, y una mezcla de casas unifamiliares y pequeños edificios multifamiliares que funcionan bien para el cuidado en el hogar con licencia, el Excelsior es un centro natural para el cuidado infantil familiar. Muchos proveedores participan en la red ELFA, haciendo que el cuidado gratuito o a bajo costo esté disponible para la mayoría de familias. Para padres que buscan inmersión en español, cuidado en tagalo, o simplemente un barrio donde su hijo crecerá escuchando múltiples idiomas, el Excelsior suele ser la respuesta.",
    introZh:
      "Excelsior是三藩市最多元及最可負擔的社區之一，其家庭托兒所格局充分反映此多元性。西班牙語托兒者、菲律賓（他加祿語）托兒者，以及粵語托兒者均集中於此，為市內嬰幼兒中心式選擇稀缺的地區服務。近14-Mission巴士線及Balboa Park BART，加上適合家庭式持牌托兒的單戶住宅與小型多戶公寓混合，使Excelsior成為家庭托兒所的天然樞紐。多家托兒者參加全民早期教育計劃 (ELFA) 網絡，大部分家庭均可獲得免費或減費托兒服務。無論您尋找西班牙語浸潤、他加祿語托兒，或希望孩子在多語言社區中成長，Excelsior通常就是答案。",

    fccDescriptionEn:
      "Family child care homes in the Excelsior typically serve mixed-age groups of up to 8 children (small FCC) or up to 14 children (large FCC). Hours here often stretch earlier or later than other neighborhoods — many providers open at 7:00 AM and close at 6:00 PM — because families in this part of the city frequently commute to the Peninsula, downtown, or the East Bay and need coverage beyond standard daycare hours. Spanish is spoken daily in many Excelsior homes, Cantonese in others, and Tagalog in a smaller but established set of homes near Mission Street. Homemade meals, cultural celebrations, and multi-generational family involvement (grandparents often help) are common features.",
    fccDescriptionEs:
      "Los hogares FCC en el Excelsior generalmente atienden a grupos de edades mixtas de hasta 8 niños (FCC pequeño) o hasta 14 niños (FCC grande). Las horas aquí a menudo se extienden más temprano o más tarde que en otros barrios — muchos proveedores abren a las 7:00 AM y cierran a las 6:00 PM — porque las familias en esta parte de la ciudad frecuentemente viajan a la Península, al centro o al East Bay y necesitan cobertura más allá del horario estándar. El español se habla diariamente en muchos hogares del Excelsior, el cantonés en otros, y el tagalo en un conjunto más pequeño pero establecido de hogares cerca de Mission Street. Las comidas caseras, celebraciones culturales y la participación familiar multigeneracional (los abuelos a menudo ayudan) son características comunes.",
    fccDescriptionZh:
      "Excelsior的家庭托兒所通常照顧混合年齡組最多8名兒童（小型FCC）或最多14名兒童（大型FCC）。本區的營業時間往往比其他社區更早或更晚——許多托兒者於7:00 AM營業並於6:00 PM關閉——因為本區家庭經常通勤至半島、市中心或東灣，需要超出標準日托時間的照護。許多Excelsior家庭每日使用西班牙語，部分使用粵語，Mission街附近的一小批但穩定的家庭使用他加祿語。家常膳食、文化慶典以及多代家庭參與（祖父母經常協助）是常見特色。",

    bilingual: {
      languageEn: "Spanish and Tagalog",
      languageEs: "Español y Tagalo",
      languageZh: "西班牙語及他加祿語",
      contentEn:
        "The Excelsior is the strongest neighborhood in San Francisco for Spanish-speaking family child care, with dozens of providers who speak Spanish daily with children in their care. For immigrant and bilingual Latino families, this is not a 'Spanish class' — it is daily immersion in a home environment where the provider speaks Spanish with the children, cooks familiar foods, celebrates holidays like Día de los Muertos and Las Posadas, and communicates comfortably with Spanish-speaking parents and grandparents. The Excelsior is also one of the few SF neighborhoods with established Tagalog-speaking family child care, offering a rare Filipino heritage-language option for infants and toddlers. Both language communities participate actively in the ELFA network, making bilingual care affordable.",
      contentEs:
        "El Excelsior es el barrio más fuerte de San Francisco para el cuidado infantil familiar de habla hispana, con docenas de proveedores que hablan español diariamente con los niños a su cargo. Para familias latinas inmigrantes y bilingües, esto no es una 'clase de español' — es inmersión diaria en un entorno hogareño donde el proveedor habla español con los niños, cocina comidas familiares, celebra fiestas como el Día de los Muertos y Las Posadas, y se comunica cómodamente con padres y abuelos de habla hispana. El Excelsior también es uno de los pocos barrios de SF con cuidado infantil familiar establecido en tagalo, ofreciendo una rara opción de idioma heredado filipino para bebés y niños pequeños. Ambas comunidades lingüísticas participan activamente en la red ELFA, haciendo asequible el cuidado bilingüe.",
      contentZh:
        "Excelsior是三藩市最強的西班牙語家庭托兒所社區，數十家托兒者每日與托管兒童使用西班牙語。對於移民及雙語拉丁裔家庭來說，這並非「西班牙語課」——而是在家庭環境中每日沉浸，托兒者以西班牙語與孩子交流、烹調熟悉的食物、慶祝亡靈節和聖誕前夕等節日，並能舒適地與說西班牙語的父母及祖父母溝通。Excelsior亦是三藩市少數擁有穩定他加祿語家庭托兒所的社區之一，為嬰幼兒提供罕見的菲律賓母語選擇。兩個語言社群均積極參與全民早期教育計劃 (ELFA) 網絡，使雙語照護更易負擔。",
      directAnswerQuestionEn: "Where can I find Spanish or Tagalog bilingual daycare in the Excelsior?",
      directAnswerQuestionEs: "¿Dónde puedo encontrar cuidado infantil bilingüe en español o tagalo en el Excelsior?",
      directAnswerQuestionZh: "在Excelsior哪裡可以找到西班牙語或他加祿語雙語托兒服務？",
      directAnswerTextEn:
        "The Excelsior District has dozens of licensed family child care homes offering daily Spanish immersion, and a smaller but established set of Tagalog-speaking providers near Mission Street. Most participate in San Francisco's ELFA subsidy network, so bilingual care is often free or low-cost. Use FamilyChildcareSF.com to search Excelsior openings filtered by Spanish or Tagalog.",
      directAnswerTextEs:
        "El Distrito Excelsior tiene docenas de hogares FCC con licencia que ofrecen inmersión diaria en español, y un conjunto más pequeño pero establecido de proveedores de habla tagala cerca de Mission Street. La mayoría participa en la red de subsidios ELFA de San Francisco, por lo que el cuidado bilingüe suele ser gratuito o a bajo costo. Use FamilyChildcareSF.com para buscar aperturas en el Excelsior filtradas por español o tagalo.",
      directAnswerTextZh:
        "Excelsior有數十家持牌家庭托兒所每日提供西班牙語浸潤，以及Mission街附近一小批穩定的他加祿語托兒者。大多數托兒者參加三藩市全民早期教育計劃 (ELFA) 補助網絡，雙語照護通常免費或低費。請使用 FamilyChildcareSF.com 按西班牙語或他加祿語篩選Excelsior的當前空位。",
    },
  },

  {
    slug: "bayview",
    nameEn: "Bayview-Hunters Point",
    nameEs: "Bayview-Hunters Point",
    nameZh: "Bayview",
    primaryLanguagesEn: ["English", "Spanish"],
    primaryLanguagesEs: ["Inglés", "Español"],
    primaryLanguagesZh: ["英語", "西班牙語"],
    typicalAgeGroupsEn: "Infants (0–18 months), Toddlers (18 months–3 years), Preschool (3–5 years), School-age",
    typicalAgeGroupsEs: "Bebés (0–18 meses), Niños pequeños (18 meses–3 años), Preescolar (3–5 años), Edad escolar",
    typicalAgeGroupsZh: "嬰兒（0–18個月）、幼兒（18個月–3歲）、學前兒童（3–5歲）、學齡兒童",
    typicalHours: "Monday–Friday, 7:00 AM – 6:00 PM",
    transitNotes: "T-Third Street, 44-O'Shaughnessy, 24-Divisadero, 23-Monterey",
    nearbyNeighborhoods: ["excelsior"],

    introEn:
      "Bayview-Hunters Point is one of San Francisco's most underserved neighborhoods for child care slots, and also one where family child care homes play an outsized role in filling that gap. Center-based infant and toddler options are particularly scarce here, which makes licensed home-based providers essential infrastructure for working families. The neighborhood has historically been a focus of ELFA expansion, and many Bayview family child care homes now participate in the subsidy network — meaning families who previously faced the hardest time finding affordable care now have the most upside from SF's universal child care expansion. Strong community organizations like the 3rd Street Hub and local Family Resource Centers support providers and families, and transit along the T-Third light rail connects the neighborhood to downtown.",
    introEs:
      "Bayview-Hunters Point es uno de los barrios más desatendidos de San Francisco en cuanto a plazas de cuidado infantil, y también uno donde los hogares FCC desempeñan un papel desproporcionado para llenar ese vacío. Las opciones centralizadas para bebés y niños pequeños son particularmente escasas aquí, lo que convierte a los proveedores en el hogar con licencia en infraestructura esencial para las familias trabajadoras. El barrio ha sido históricamente un foco de expansión de ELFA, y muchos hogares FCC del Bayview ahora participan en la red de subsidios — lo que significa que las familias que antes tenían más dificultades para encontrar cuidado asequible ahora tienen la mayor ventaja de la expansión universal del cuidado infantil de SF. Organizaciones comunitarias fuertes como el 3rd Street Hub y los Centros de Recursos Familiares locales apoyan a proveedores y familias, y el transporte a lo largo del tren ligero T-Third conecta el barrio con el centro.",
    introZh:
      "Bayview是三藩市托兒名額最不足的社區之一，亦是家庭托兒所在填補缺口方面發揮超大作用的地區。此區的嬰幼兒中心式選擇尤其稀缺，使持牌家庭托兒者成為雙職家庭的重要基礎設施。本社區一直是全民早期教育計劃 (ELFA) 擴展的重點，多家Bayview 家庭托兒所現已參加補助網絡——意味著以往最難找到可負擔托兒服務的家庭，如今在三藩市全民托兒擴展中獲益最大。強大的社區組織如3rd Street Hub和當地家庭資源中心支持托兒者與家庭，T-Third輕軌將本社區連接至市中心。",

    fccDescriptionEn:
      "Family child care homes in Bayview-Hunters Point typically serve mixed-age groups of up to 8 children (small FCC) or up to 14 children (large FCC). Many providers open early (7:00 AM) and stay open later (6:00 PM) to accommodate parents commuting downtown or to the Peninsula. English is the primary language in most homes, with Spanish spoken in a growing number of providers serving the neighborhood's Latino community. Providers here often have long-standing relationships with the families they serve, and multi-generational care (caring for the children of parents they cared for years earlier) is not uncommon. Many homes participate in the ELFA network and Head Start collaborations.",
    fccDescriptionEs:
      "Los hogares FCC en Bayview-Hunters Point generalmente atienden a grupos de edades mixtas de hasta 8 niños (FCC pequeño) o hasta 14 niños (FCC grande). Muchos proveedores abren temprano (7:00 AM) y permanecen abiertos más tarde (6:00 PM) para acomodar a los padres que viajan al centro o a la Península. El inglés es el idioma principal en la mayoría de los hogares, con el español hablado en un número creciente de proveedores que atienden a la comunidad latina del barrio. Los proveedores aquí a menudo tienen relaciones de larga data con las familias a las que atienden, y el cuidado multigeneracional (cuidar a los hijos de padres que cuidaron años antes) no es infrecuente. Muchos hogares participan en la red ELFA y colaboraciones con Head Start.",
    fccDescriptionZh:
      "Bayview的家庭托兒所通常照顧混合年齡組最多8名兒童（小型FCC）或最多14名兒童（大型FCC）。許多托兒者提早營業（7:00 AM）並延長至較晚時段（6:00 PM），以配合通勤市中心或半島的家長。大多數家庭以英語為主，越來越多托兒者服務本社區的拉丁裔社群並使用西班牙語。本區托兒者通常與服務的家庭有長期關係，多代托兒（照顧多年前所照顧家長的子女）並不罕見。許多家庭托兒所參加全民早期教育計劃 (ELFA) 網絡以及Head Start合作項目。",

    bilingual: {
      languageEn: "Spanish",
      languageEs: "Español",
      languageZh: "西班牙語",
      contentEn:
        "A growing number of Bayview family child care homes serve the neighborhood's Spanish-speaking Latino community, offering daily Spanish conversation, cultural celebrations, and home-cooked meals that reflect Mexican, Salvadoran, and other Latin American traditions. For immigrant families in the Bayview — who have historically had fewer affordable bilingual care options than in the Mission or Excelsior — this is meaningful: ELFA subsidies make Spanish-immersion care a realistic choice rather than a luxury.",
      contentEs:
        "Un número creciente de hogares FCC del Bayview atienden a la comunidad latina de habla hispana del barrio, ofreciendo conversación diaria en español, celebraciones culturales y comidas caseras que reflejan tradiciones mexicanas, salvadoreñas y de otras tradiciones latinoamericanas. Para las familias inmigrantes en el Bayview — que históricamente han tenido menos opciones de cuidado bilingüe asequible que en la Mission o el Excelsior — esto es significativo: los subsidios ELFA hacen del cuidado de inmersión en español una opción realista en lugar de un lujo.",
      contentZh:
        "越來越多的Bayview 家庭托兒所服務本社區的西班牙語拉丁裔社群，每日提供西班牙語對話、文化慶典，以及反映墨西哥、薩爾瓦多及其他拉美傳統的家常膳食。對於Bayview 的移民家庭而言——她們在歷史上比Mission區或Excelsior區擁有更少的可負擔雙語選擇——這意義重大：全民早期教育計劃 (ELFA) 補助讓西班牙語浸潤托兒成為實際選擇，而非奢侈品。",
      directAnswerQuestionEn: "Where can I find Spanish bilingual daycare in the Bayview?",
      directAnswerQuestionEs: "¿Dónde puedo encontrar cuidado infantil bilingüe en español en el Bayview?",
      directAnswerQuestionZh: "在Bayview哪裡可以找到西班牙語雙語托兒服務？",
      directAnswerTextEn:
        "Bayview-Hunters Point has a growing set of licensed family child care homes where Spanish is spoken daily alongside English. Most participate in San Francisco's ELFA subsidy network, making bilingual care affordable for families who previously had few options. Use FamilyChildcareSF.com to search Bayview openings filtered by Spanish language.",
      directAnswerTextEs:
        "Bayview-Hunters Point tiene un conjunto creciente de hogares FCC con licencia donde se habla español diariamente junto al inglés. La mayoría participa en la red de subsidios ELFA de San Francisco, haciendo asequible el cuidado bilingüe para familias que antes tenían pocas opciones. Use FamilyChildcareSF.com para buscar aperturas en el Bayview filtradas por español.",
      directAnswerTextZh:
        "Bayview有越來越多的持牌家庭托兒所日常以西班牙語配合英語授課。大多數托兒者參加三藩市全民早期教育計劃 (ELFA) 補助網絡，使雙語照護對以往選擇有限的家庭更易負擔。請使用 FamilyChildcareSF.com 按西班牙語篩選Bayview的當前空位。",
    },
  },

  {
    slug: "mission",
    nameEn: "Mission District",
    nameEs: "Distrito Misión",
    nameZh: "Mission",
    primaryLanguagesEn: ["Spanish", "English"],
    primaryLanguagesEs: ["Español", "Inglés"],
    primaryLanguagesZh: ["西班牙語", "英語"],
    typicalAgeGroupsEn: "Infants (0–18 months), Toddlers (18 months–3 years), Preschool (3–5 years)",
    typicalAgeGroupsEs: "Bebés (0–18 meses), Niños pequeños (18 meses–3 años), Preescolar (3–5 años)",
    typicalAgeGroupsZh: "嬰兒（0–18個月）、幼兒（18個月–3歲）、學前兒童（3–5歲）",
    typicalHours: "Monday–Friday, 7:30 AM – 6:00 PM",
    transitNotes: "14-Mission, 14R-Mission Rapid, 49-Van Ness/Mission, 24-Divisadero, 16th St BART, 24th St BART, J-Church",
    nearbyNeighborhoods: ["excelsior"],

    introEn:
      "The Mission District is San Francisco's historic heart of Spanish-speaking family child care. Generations of Latino families have raised children in the Mission, and many of today's providers grew up in the neighborhood themselves — which means the care they offer reflects not only the Spanish language but the specific cultural rhythms of Mission families. With two BART stations, multiple bus lines, and a tight residential street grid, the Mission is one of the most transit-accessible neighborhoods in the city for working parents. Many providers participate in the ELFA network, making Spanish-immersion care free or low-cost for eligible families, and the presence of community institutions like Mission Neighborhood Centers, MCF, and Centro Latino means families have strong support structures beyond the provider's door.",
    introEs:
      "El Distrito Misión es el corazón histórico de San Francisco del cuidado infantil familiar en español. Generaciones de familias latinas han criado niños en la Misión, y muchos de los proveedores actuales crecieron en el barrio ellos mismos — lo que significa que el cuidado que ofrecen refleja no solo el idioma español sino los ritmos culturales específicos de las familias de la Misión. Con dos estaciones BART, múltiples líneas de autobús y una cuadrícula de calles residenciales apretada, la Misión es uno de los barrios más accesibles en transporte para padres trabajadores. Muchos proveedores participan en la red ELFA, haciendo que el cuidado de inmersión en español sea gratuito o a bajo costo para las familias elegibles, y la presencia de instituciones comunitarias como Mission Neighborhood Centers, MCF y Centro Latino significa que las familias tienen fuertes estructuras de apoyo más allá de la puerta del proveedor.",
    introZh:
      "Mission是三藩市西班牙語家庭托兒所的歷史中心。數代拉丁裔家庭在Mission撫養孩子，今日許多托兒者本身就是在本區長大——意味著她們提供的照護不僅反映西班牙語，也反映Mission家庭的特定文化節奏。擁有兩個BART車站、多條巴士線路及密集的住宅街網，Mission是雙職家長最便利乘搭公共交通的社區之一。許多托兒者參加全民早期教育計劃 (ELFA) 網絡，合資格家庭可免費或低費獲得西班牙語浸潤托兒；加上Mission Neighborhood Centers、MCF及Centro Latino等社區機構，使家庭在托兒者門外仍有強大的支援結構。",

    fccDescriptionEn:
      "Family child care homes in the Mission typically serve mixed-age groups of up to 8 children (small FCC) or up to 14 children (large FCC). Hours vary but most providers operate Monday through Friday from roughly 7:30 AM to 6:00 PM, accommodating parents with varied work schedules including restaurant, construction, and service-industry work common in the neighborhood. Spanish is the primary language of care in the majority of Mission family child care homes. Meals are typically home-cooked and reflect Mexican, Salvadoran, Guatemalan, and Nicaraguan traditions. Holidays like Día de los Muertos, Las Posadas, and Three Kings Day are celebrated as part of the normal calendar, not as add-ons.",
    fccDescriptionEs:
      "Los hogares FCC en la Misión generalmente atienden a grupos de edades mixtas de hasta 8 niños (FCC pequeño) o hasta 14 niños (FCC grande). Las horas varían pero la mayoría de los proveedores operan de lunes a viernes aproximadamente de 7:30 AM a 6:00 PM, acomodando a padres con horarios de trabajo variados, incluyendo trabajo en restaurantes, construcción y servicios comunes en el barrio. El español es el idioma principal de cuidado en la mayoría de los hogares FCC de la Misión. Las comidas típicamente son caseras y reflejan tradiciones mexicanas, salvadoreñas, guatemaltecas y nicaragüenses. Las festividades como el Día de los Muertos, Las Posadas y el Día de Reyes se celebran como parte del calendario normal, no como complementos.",
    fccDescriptionZh:
      "Mission的家庭托兒所通常照顧混合年齡組最多8名兒童（小型FCC）或最多14名兒童（大型FCC）。營業時間不一，但大多數托兒者於週一至週五約7:30 AM至6:00 PM營業，照顧本區常見的餐廳、建築及服務業等工作時間變化較大的家長。西班牙語是Mission大多數家庭托兒所的主要照護語言。膳食通常是自製家常菜，反映墨西哥、薩爾瓦多、瓜地馬拉及尼加拉瓜的傳統。亡靈節、聖誕前夕（Las Posadas）及主顯節等節日均作為日常日曆的一部分來慶祝，而非附加活動。",

    bilingual: {
      languageEn: "Spanish",
      languageEs: "Español",
      languageZh: "西班牙語",
      contentEn:
        "The Mission has the highest concentration of Spanish-speaking family child care providers in San Francisco. For Spanish-speaking families, this means daily immersion from infancy in a home where the language, the food, the music, and the rhythm of the day are continuous with home life. For bilingual or English-dominant Latino families who want their children to grow up connected to the language of their grandparents, Mission family child care offers something center-based Spanish programs rarely can: provider-child relationships that span years, cultural celebrations woven into daily life, and conversation with family members in Spanish at drop-off and pick-up. Most Mission providers participate in the ELFA network.",
      contentEs:
        "La Misión tiene la mayor concentración de proveedores de cuidado infantil familiar de habla hispana en San Francisco. Para las familias de habla hispana, esto significa inmersión diaria desde la infancia en un hogar donde el idioma, la comida, la música y el ritmo del día son continuos con la vida en el hogar. Para las familias latinas bilingües o de habla inglesa predominante que quieren que sus hijos crezcan conectados al idioma de sus abuelos, el cuidado infantil familiar de la Misión ofrece algo que los programas centralizados de español raramente pueden: relaciones proveedor-niño que abarcan años, celebraciones culturales integradas en la vida diaria, y conversación con miembros de la familia en español al dejar y recoger. La mayoría de los proveedores de la Misión participan en la red ELFA.",
      contentZh:
        "Mission擁有全三藩市最密集的西班牙語家庭托兒者。對於說西班牙語的家庭來說，這意味著從嬰兒期開始每日在家庭環境中沉浸——那裡的語言、食物、音樂和日常節奏都與家中生活相連。對於希望孩子能連繫祖父母語言的雙語或英語為主的拉丁裔家庭，Mission的家庭托兒提供了中心式西班牙語計劃少能給予的價值：跨越多年的托兒者-兒童關係、融入日常生活的文化慶典，以及接送時以西班牙語與家人對話。大多數Mission托兒者參加全民早期教育計劃 (ELFA) 網絡。",
      directAnswerQuestionEn: "Where can I find Spanish bilingual daycare in the Mission?",
      directAnswerQuestionEs: "¿Dónde puedo encontrar cuidado infantil bilingüe en español en la Misión?",
      directAnswerQuestionZh: "在Mission哪裡可以找到西班牙語雙語托兒服務？",
      directAnswerTextEn:
        "The Mission District has the highest concentration of Spanish-speaking licensed family child care homes in San Francisco. Spanish is the primary language of daily care in most Mission FCC homes, and most participate in the city's ELFA subsidy network — so immersion care is often free or low-cost. Use FamilyChildcareSF.com to search Mission openings filtered by Spanish language.",
      directAnswerTextEs:
        "El Distrito Misión tiene la mayor concentración de hogares FCC con licencia de habla hispana en San Francisco. El español es el idioma principal del cuidado diario en la mayoría de los hogares FCC de la Misión, y la mayoría participa en la red de subsidios ELFA de la ciudad — por lo que el cuidado de inmersión suele ser gratuito o a bajo costo. Use FamilyChildcareSF.com para buscar aperturas en la Misión filtradas por español.",
      directAnswerTextZh:
        "Mission擁有三藩市密度最高的西班牙語持牌家庭托兒所。西班牙語是大多數Mission家庭托兒所的主要日常照護語言，而大多數托兒者參加三藩市全民早期教育計劃 (ELFA) 補助網絡——因此浸潤式照護通常免費或低費。請使用 FamilyChildcareSF.com 按西班牙語篩選Mission的當前空位。",
    },
  },
];

export function getNeighborhoodBySlug(slug) {
  return neighborhoods.find((n) => n.slug === slug);
}
