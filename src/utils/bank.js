export default function getBank(){
    const bank = [
        {
            "title": "BANK BRI",
            "value": "002"
        },
        {
            "title": "BANK NEO COMMERCE",
            "value": "003"
        },
        {
            "title": "BANK MANDIRI",
            "value": "008"
        },
        {
            "title": "BANK BNI",
            "value": "009"
        },
        {
            "title": "BANK BNI SYARIAH",
            "value": "427"
        },
        {
            "title": "BANK DANAMON",
            "value": "011"
        },
        {
            "title": "PERMATA BANK",
            "value": "013"
        },
        {
            "title": "BANK BCA",
            "value": "014"
        },
        {
            "title": "BANK BII",
            "value": "016"
        },
        {
            "title": "BANK PANIN",
            "value": "019"
        },
        {
            "title": "LINE BANK by Hana Bank",
            "value": "020"
        },
        {
            "title": "BANK NIAGA",
            "value": "022"
        },
        {
            "title": "SEABANK INDONESIA",
            "value": "023"
        },
        {
            "title": "BANK LIPPO",
            "value": "026"
        },
        {
            "title": "BANK NISP",
            "value": "028"
        },
        {
            "title": "AMERICAN EXPRESS BANK LTD",
            "value": "030"
        },
        {
            "title": "CITIBANK N.A.",
            "value": "031"
        },
        {
            "title": "JP. MORGAN CHASE BANK, N.A.",
            "value": "032"
        },
        {
            "title": "BANK OF AMERICA, N.A",
            "value": "033"
        },
        {
            "title": "ING INDONESIA BANK",
            "value": "034"
        },
        {
            "title": "BANK MULTICOR TBK.",
            "value": "036"
        },
        {
            "title": "BANK SYARIAH INDONESIA (BSI)",
            "value": "037"
        },
        {
            "title": "BANK CIMB",
            "value": "039"
        },
        {
            "title": "THE BANGKOK BANK COMP. LTD",
            "value": "040"
        },
        {
            "title": "THE HONGKONG & SHANGHAI B.C.",
            "value": "041"
        },
        {
            "title": "THE BANK OF TOKYO MITSUBISHI UFJ LTD",
            "value": "042"
        },
        {
            "title": "BANK SUMITOMO MITSUI INDONESIA",
            "value": "045"
        },
        {
            "title": "BANK DBS INDONESIA",
            "value": "046"
        },
        {
            "title": "BANK RESONA PERDANIA",
            "value": "047"
        },
        {
            "title": "BANK MIZUHO INDONESIA",
            "value": "048"
        },
        {
            "title": "STANDARD CHARTERED BANK",
            "value": "050"
        },
        {
            "title": "BANK ABN AMRO",
            "value": "052"
        },
        {
            "title": "BANK KEPPEL TATLEE BUANA",
            "value": "053"
        },
        {
            "title": "BANK CAPITAL INDONESIA, TBK.",
            "value": "054"
        },
        {
            "title": "BANK BNP PARIBAS INDONESIA",
            "value": "057"
        },
        {
            "title": "BANK UOB INDONESIA",
            "value": "058"
        },
        {
            "title": "KOREA EXCHANGE BANK DANAMON",
            "value": "059"
        },
        {
            "title": "RABOBANK INTERNASIONAL INDONESIA",
            "value": "060"
        },
        {
            "title": "ANZ PANIN BANK",
            "value": "061"
        },
        {
            "title": "DEUTSCHE BANK AG.",
            "value": "067"
        },
        {
            "title": "BANK WOORI INDONESIA",
            "value": "068"
        },
        {
            "title": "BANK OF CHINA LIMITED",
            "value": "069"
        },
        {
            "title": "BANK BUMI ARTA",
            "value": "076"
        },
        {
            "title": "BANK EKONOMI",
            "value": "087"
        },
        {
            "title": "BANK ANTARDAERAH",
            "value": "088"
        },
        {
            "title": "BANK HAGA",
            "value": "089"
        },
        {
            "title": "BANK IFI",
            "value": "093"
        },
        {
            "title": "BANK CENTURY, TBK.",
            "value": "095"
        },
        {
            "title": "BANK MAYAPADA",
            "value": "097"
        },
        {
            "title": "BANK JABAR",
            "value": "110"
        },
        {
            "title": "BANK DKI",
            "value": "111"
        },
        {
            "title": "BPD DIY",
            "value": "112"
        },
        {
            "title": "BANK JATENG",
            "value": "113"
        },
        {
            "title": "BANK JATIM",
            "value": "114"
        },
        {
            "title": "BPD JAMBI",
            "value": "115"
        },
        {
            "title": "BPD ACEH",
            "value": "116"
        },
        {
            "title": "BANK SUMUT",
            "value": "117"
        },
        {
            "title": "BANK NAGARI",
            "value": "118"
        },
        {
            "title": "BANK RIAU",
            "value": "119"
        },
        {
            "title": "BANK SUMSEL",
            "value": "120"
        },
        {
            "title": "BANK LAMPUNG",
            "value": "121"
        },
        {
            "title": "BPD KALSEL",
            "value": "122"
        },
        {
            "title": "BPD KALIMANTAN BARAT",
            "value": "123"
        },
        {
            "title": "BPD KALTIM",
            "value": "124"
        },
        {
            "title": "BPD KALTENG",
            "value": "125"
        },
        {
            "title": "BPD SULSEL",
            "value": "126"
        },
        {
            "title": "BANK SULUT",
            "value": "127"
        },
        {
            "title": "BPD NTB",
            "value": "128"
        },
        {
            "title": "BPD BALI",
            "value": "129"
        },
        {
            "title": "BANK NTT",
            "value": "130"
        },
        {
            "title": "BANK MALUKU",
            "value": "131"
        },
        {
            "title": "BPD PAPUA",
            "value": "132"
        },
        {
            "title": "BANK BENGKULU",
            "value": "133"
        },
        {
            "title": "BPD SULAWESI TENGAH",
            "value": "134"
        },
        {
            "title": "BANK SULTRA",
            "value": "135"
        },
        {
            "title": "BANK NUSANTARA PARAHYANGAN",
            "value": "145"
        },
        {
            "title": "BANK SWADESI",
            "value": "146"
        },
        {
            "title": "BANK MUAMALAT",
            "value": "147"
        },
        {
            "title": "BANK MESTIKA",
            "value": "151"
        },
        {
            "title": "BANK METRO EXPRESS",
            "value": "152"
        },
        {
            "title": "BANK SHINTA INDONESIA",
            "value": "153"
        },
        {
            "title": "BANK MASPION",
            "value": "157"
        },
        {
            "title": "BANK HAGAKITA",
            "value": "159"
        },
        {
            "title": "BANK GANESHA",
            "value": "161"
        },
        {
            "title": "BANK WINDU KENTJANA",
            "value": "162"
        },
        {
            "title": "HALIM INDONESIA BANK",
            "value": "164"
        },
        {
            "title": "BANK HARMONI INTERNATIONAL",
            "value": "166"
        },
        {
            "title": "BANK KESAWAN",
            "value": "167"
        },
        {
            "title": "BANK TABUNGAN NEGARA (PERSERO)",
            "value": "200"
        },
        {
            "title": "BANK HIMPUNAN SAUDARA 1906, TBK .",
            "value": "212"
        },
        {
            "title": "BANK TABUNGAN PENSIUNAN NASIONAL (BTPN)",
            "value": "213"
        },
        {
            "title": "BANK SWAGUNA",
            "value": "405"
        },
        {
            "title": "BANK JASA ARTA",
            "value": "422"
        },
        {
            "title": "BANK MEGA",
            "value": "426"
        },
        {
            "title": "BANK JASA JAKARTA",
            "value": "427"
        },
        {
            "title": "BANK BUKOPIN",
            "value": "441"
        },
        {
            "title": "BANK SYARIAH MANDIRI",
            "value": "451"
        },
        {
            "title": "BANK BISNIS INTERNASIONAL",
            "value": "459"
        },
        {
            "title": "BANK SRI PARTHA",
            "value": "466"
        },
        {
            "title": "BANK JASA JAKARTA",
            "value": "472"
        },
        {
            "title": "BANK BINTANG MANUNGGAL",
            "value": "484"
        },
        {
            "title": "BANK BUMIPUTERA",
            "value": "485"
        },
        {
            "title": "BANK YUDHA BHAKTI",
            "value": "490"
        },
        {
            "title": "BANK MITRANIAGA",
            "value": "491"
        },
        {
            "title": "BANK AGRO NIAGA",
            "value": "494"
        },
        {
            "title": "BANK INDOMONEX",
            "value": "498"
        },
        {
            "title": "BANK ROYAL INDONESIA",
            "value": "501"
        },
        {
            "title": "BANK ALFINDO",
            "value": "503"
        },
        {
            "title": "BANK SYARIAH MEGA",
            "value": "506"
        },
        {
            "title": "BANK INA PERDANA",
            "value": "513"
        },
        {
            "title": "BANK HARFA",
            "value": "517"
        },
        {
            "title": "PRIMA MASTER BANK",
            "value": "520"
        },
        {
            "title": "BANK PERSYARIKATAN INDONESIA",
            "value": "521"
        },
        {
            "title": "BANK AKITA",
            "value": "525"
        },
        {
            "title": "LIMAN INTERNATIONAL BANK",
            "value": "526"
        },
        {
            "title": "ANGLOMAS INTERNASIONAL BANK",
            "value": "531"
        },
        {
            "title": "BANK DIPO INTERNATIONAL",
            "value": "523"
        },
        {
            "title": "BANK KESEJAHTERAAN EKONOMI",
            "value": "535"
        },
        {
            "title": "BANK UIB",
            "value": "536"
        },
        {
            "title": "BANK ARTOS IND (JAGO)",
            "value": "542"
        },
        {
            "title": "BANK PURBA DANARTA",
            "value": "547"
        },
        {
            "title": "BANK MULTI ARTA SENTOSA",
            "value": "548"
        },
        {
            "title": "BANK MAYORA",
            "value": "553"
        },
        {
            "title": "BANK INDEX SELINDO",
            "value": "555"
        },
        {
            "title": "BANK VICTORIA INTERNATIONAL",
            "value": "566"
        },
        {
            "title": "BANK EKSEKUTIF",
            "value": "558"
        },
        {
            "title": "CENTRATAMA NASIONAL BANK",
            "value": "559"
        },
        {
            "title": "BANK FAMA INTERNASIONAL",
            "value": "562"
        },
        {
            "title": "BANK SINAR HARAPAN BALI",
            "value": "564"
        },
        {
            "title": "BANK HARDA",
            "value": "567"
        },
        {
            "title": "BANK FINCONESIA",
            "value": "945"
        },
        {
            "title": "BANK MERINCORP",
            "value": "946"
        },
        {
            "title": "BANK MAYBANK INDOCORP",
            "value": "947"
        },
        {
            "title": "BANK OCBC – INDONESIA",
            "value": "948"
        },
        {
            "title": "BANK CHINA TRUST INDONESIA",
            "value": "949"
        },
        {
            "title": "BANK COMMONWEALTH",
            "value": "950"
        },
        {
            "title": "BANK BJB SYARIAH",
            "value": "425"
        },
        {
            "title": "BPR KS (KARYAJATNIKA SEDAYA)",
            "value": "688"
        },
        {
            "title": "INDOSAT DOMPETKU",
            "value": "789"
        },
        {
            "title": "TELKOMSEL TCASH",
            "value": "911"
        },
        {
            "title": "LINKAJA",
            "value": "911"
        }
    ]

    return bank
}