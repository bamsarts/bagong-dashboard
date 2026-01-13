import { 
    BsGraphUp,
    BsGear,
    BsClock,
    BsCreditCard,
    BsTag,
    BsFileText,
    BsTicket,
    BsWhatsapp,
    BsDiscord,
    BsWrench   
} from 'react-icons/bs'

import { FaTicketAlt } from 'react-icons/fa'
import { FaRupiahSign } from "react-icons/fa6";

export const ADMIN_BASE_URL = '/admin'

export const ICONS = {
    ['/admin/dashboard'] : <BsGraphUp/>,
    ['/admin/transaction'] : <FaRupiahSign/>,
    ['/admin/master-data'] : <BsGear/>,
    ['/admin/schedule'] : <BsClock/>,
    ['/admin/finance'] : <BsCreditCard/>,
    ['/admin/marketing-and-support'] : <BsTag/>,
    ['/admin/report'] : <BsFileText/>,
    ['/admin/ticket-order'] : <FaTicketAlt/>,
    ['/admin/modul-whatsapp'] : <BsWhatsapp/>,
    ['/admin/sandbox'] : <BsDiscord/>,
    ['/admin/operasional'] : <BsWrench />,
}

export const DASHBOARD = {
    title : 'Dashboard',
    href : ADMIN_BASE_URL + '/dashboard',
    icon : <BsGraphUp/>
}

export const REPORT = {
    title : 'Laporan',
    href : ADMIN_BASE_URL + '/report',
    icon : <BsFileText/>,
    subMenus: []
}

export const REPORT_SALES = {
    title : 'Pendapatan',
    href : ADMIN_BASE_URL + '/report/sales'
}

export const REPORT_DEPOSIT = {
    title : 'Setoran',
    href : ADMIN_BASE_URL + '/report/deposit',
    subMenus: []
}

export const REPORT_DEPOSIT_COMMUTER = {
    title : 'Pemadumoda',
    href : ADMIN_BASE_URL + '/report/deposit/commuter'
}

export const REPORT_TRANSACTION = {
    title : 'Transaksi',
    href : ADMIN_BASE_URL + '/report/transaction',
    subMenus: []
}

export const REPORT_TRANSACTION_AIRPORT = {
    title : 'Penjualan Bandara',
    href : ADMIN_BASE_URL + '/report/transaction/airport',
}

export const REPORT_TRANSACTION_SHIFT = {
    title : 'Penjualan Shift',
    href : ADMIN_BASE_URL + '/report/transaction/shift',
}

export const REPORT_TRANSACTION_DAILY = {
    title : 'Penjualan Harian',
    href : ADMIN_BASE_URL + '/report/transaction/daily',
}

export const FINANCE = {
    title : 'Keuangan',
    href : ADMIN_BASE_URL + '/finance',
    icon : <BsFileText/>,
    subMenus: []
}

export const FINANCE_TRANSACTION = {
    title : 'Transaksi',
    href : ADMIN_BASE_URL + '/finance/transaction',
    subMenus: []
}

export const FINANCE_DEPOSIT = {
    title : 'Setoran',
    href : ADMIN_BASE_URL + '/finance/deposit',
    subMenus: []
}

export const FINANCE_TRANSACTION_COMMUTER = {
    title : 'Pemadumoda',
    href : ADMIN_BASE_URL + '/finance/transaction/commuter',
}

export const FINANCE_DEPOSIT_COMMUTER = {
    title : 'Pemadumoda',
    href : ADMIN_BASE_URL + '/finance/deposit/commuter',
}

export const TICKET_ORDER = {
    title : 'Pesan Tiket',
    href : ADMIN_BASE_URL + '/ticket-order',
    isHide: false,
    subMenus: [
        {
            title : 'AKAP',
            href : ADMIN_BASE_URL + '/ticket-order/intercity',
            isHide: false
        },
        {
            title : 'Pemadumoda',
            href : ADMIN_BASE_URL + '/ticket-order/commuter',
            isHide: false
        }
    ]
}

//for finance surge
export const NAVIGATIONS_FINANCE = [
    DASHBOARD,
    REPORT
]

NAVIGATIONS_FINANCE[1].subMenus.push(REPORT_SALES)
NAVIGATIONS_FINANCE[1].subMenus.push(REPORT_TRANSACTION)
NAVIGATIONS_FINANCE[1].subMenus[1].subMenus.push(REPORT_TRANSACTION_AIRPORT)
NAVIGATIONS_FINANCE[1].subMenus[1].subMenus.push(REPORT_TRANSACTION_DAILY)
NAVIGATIONS_FINANCE[1].subMenus[1].subMenus.push(REPORT_TRANSACTION_SHIFT)

//

//for pool account
export const NAVIGATIONS_POOL = [
    DASHBOARD,
    {
        title : 'Keuangan',
        icon : <BsCreditCard/>,
        href : ADMIN_BASE_URL + '/finance',
        isHide: false,
        subMenus : [
            {
                title : 'Setoran',
                href : ADMIN_BASE_URL + '/finance/deposit',
                isHide: false,
                subMenus : [
                    {
                        title : 'Pemadumoda',
                        href : ADMIN_BASE_URL + '/finance/deposit/commuter',
                        isHide: false
                    }
                ]
            },
            {
                title : 'Transaksi',
                href : ADMIN_BASE_URL + '/finance/transaction',
                isHide: false,
                subMenus : [
                    {
                        title : 'Pemadumoda',
                        href : ADMIN_BASE_URL + '/finance/transaction/commuter',
                        isHide: false,
                    }
                ]
            }
        ]
    },
    {
        title : 'Laporan',
        href : ADMIN_BASE_URL + '/report',
        icon : <BsFileText/>,
        isHide: false,
        subMenus : [
            {
                title : 'Setoran',
                href : ADMIN_BASE_URL + '/report/deposit',
                isHide: false,
                subMenus : [
                    {
                        title : 'Pemadumoda',
                        href : ADMIN_BASE_URL + '/report/deposit/commuter'
                    }
                ]
            }
        ]
    }
]
//

export const NAVIGATIONS_ADMIN_CABANG = [
    DASHBOARD,
    {
        title : 'Master Data',
        href : ADMIN_BASE_URL + '/master-data',
        icon : <BsGear/>,
        subMenus : [
            {
                title : 'Trayek',
                href : ADMIN_BASE_URL + '/master-data/traject',
                subMenus : [
                    {
                        title : 'Daftar Trayek',
                        href : ADMIN_BASE_URL + '/master-data/traject/commuter'
                    }
                ]
            },
            {
                title : 'User & Role Akses',
                href : ADMIN_BASE_URL + '/master-data/user-and-access-role',
                subMenus : [
                    {
                        title : 'User',
                        href : ADMIN_BASE_URL + '/master-data/user-and-access-role/user'
                    }
                ]
            },
        ]
    },
    {
        title : 'Laporan',
        href : ADMIN_BASE_URL + '/report',
        icon : <BsFileText/>,
        subMenus : [
            {
                title : 'Transaksi',
                href : ADMIN_BASE_URL + '/report/transaction',
                subMenus : [
                    {
                        title : 'Penjualan Bandara',
                        href : ADMIN_BASE_URL + '/report/transaction/airport'
                    },
                    {
                        title : 'Penjualan Shift',
                        href : ADMIN_BASE_URL + '/report/transaction/shift'
                    },
                    {
                        title : 'Penjualan Harian',
                        href : ADMIN_BASE_URL + '/report/transaction/daily'
                    }
                ]
            },
            {
                title : 'Pendapatan',
                href : ADMIN_BASE_URL + '/report/sales'
            },
        ]
    }
]

export const NAVIGATIONS = [
    {
        title : 'Dashboard',
        href : ADMIN_BASE_URL + '/dashboard',
        icon : <BsGraphUp/>,
        isHide: false,
    },
    {
        title : 'Transaksi',
        href : ADMIN_BASE_URL + '/transaction',
        icon : <FaRupiahSign/>,
        isHide: false,
    },
    TICKET_ORDER,
    {
        title : 'Master Data',
        href : ADMIN_BASE_URL + '/master-data',
        icon : <BsGear/>,
        isHide: false,
        subMenus : [
            {
                title : 'Profil',
                href : ADMIN_BASE_URL + '/master-data/profile',
                isHide: false,
            },
            {
                title : 'Bus',
                href : ADMIN_BASE_URL + '/master-data/bus',
                isHide: false,
                subMenus : [
                    {
                        title : 'Daftar Bus',
                        href : ADMIN_BASE_URL + '/master-data/bus/bus-list',
                        isHide: false,
                    },
                    {
                        title : 'Kategori Bus',
                        href : ADMIN_BASE_URL + '/master-data/bus/bus-category'
                    },
                    {
                        title : 'Fasilitas Bus',
                        href : ADMIN_BASE_URL + '/master-data/bus/bus-facility'
                    }
                ]
            },
            {
                title : 'Cabang',
                href : ADMIN_BASE_URL + '/master-data/branch',
                subMenus : [
                    {
                        title : 'Daftar Cabang',
                        href : ADMIN_BASE_URL + '/master-data/branch/branch-list'
                    },
                    {
                        title : 'Pool',
                        href : ADMIN_BASE_URL + '/master-data/branch/pool'
                    }
                ]
            },
            {
                title : 'User & Role Akses',
                href : ADMIN_BASE_URL + '/master-data/user-and-access-role',
                subMenus : [
                    {
                        title : 'User Operasional',
                        href : ADMIN_BASE_URL + '/master-data/user-and-access-role/user'
                    },
                    {
                        title : 'Role Akses',
                        href : ADMIN_BASE_URL + '/master-data/user-and-access-role/access-role'
                    },
                    {
                        title : 'User Apps',
                        href : ADMIN_BASE_URL + '/master-data/user-and-access-role/user-apps'
                    },
                    {
                        title : 'Keanggotaan',
                        href : ADMIN_BASE_URL + '/master-data/user-and-access-role/membership'
                    }
                ]
            },
            {
                title : 'Point',
                href : ADMIN_BASE_URL + '/master-data/point'
            },
            {
                title : 'Trayek',
                href : ADMIN_BASE_URL + '/master-data/traject',
                subMenus : [
                    {
                        title : 'Daftar Trip',
                        href : ADMIN_BASE_URL + '/master-data/traject/commuter'
                    },
                    {
                        title : 'Daftar Trayek',
                        href : ADMIN_BASE_URL + '/master-data/traject/traject-list'
                    },
                    {
                        title : 'Transit',
                        href : ADMIN_BASE_URL + '/master-data/traject/multi-traject'
                    }
                ]
            },
            {
                title : 'Counter',
                href : ADMIN_BASE_URL + '/master-data/counter'
            },
            {
                title : 'Company',
                href : ADMIN_BASE_URL + '/master-data/company'
            },
            {
                title : 'Media',
                href : ADMIN_BASE_URL + '/master-data/media'
            },
            {
                title : 'Jadwal Template',
                href : ADMIN_BASE_URL + '/master-data/schedule-template',
                subMenus : [
                    {
                        title : 'AKAP',
                        href : ADMIN_BASE_URL + '/master-data/schedule-template/intercity'
                    },
                    
                ]
            },
            {
                title : 'Setoran',
                href : ADMIN_BASE_URL + '/master-data/setoran'
            },
            {
                title : 'EDC',
                href : ADMIN_BASE_URL + '/master-data/edc-bank'
            },
            {
                title : 'Shortlink',
                href : ADMIN_BASE_URL + '/master-data/shortlink'
            },
            {
                title : 'Penugasan Template',
                href : ADMIN_BASE_URL + '/master-data/assignment-template'
            },
        ]
    },
    {
        title : 'Jadwal',
        href : ADMIN_BASE_URL + '/schedule',
        icon : <BsClock/>,
        subMenus: [
            {
                title : 'AKAP',
                href : ADMIN_BASE_URL + '/schedule/intercity',
                isHide: false,
            },
            {
                title : 'Bandara',
                href : ADMIN_BASE_URL + '/schedule/airport',
                isHide: false,
            },
            {
                title : 'Manifest Penumpang',
                href : ADMIN_BASE_URL + '/schedule/manifest',
                isHide: false,
            },
            {
                title : 'Rute Koneksi',
                href : ADMIN_BASE_URL + '/schedule/connection-route',
                isHide: false,
            },
        ]
    },
    {
        title : 'Keuangan',
        icon : <BsCreditCard/>,
        href : ADMIN_BASE_URL + '/finance',
        isHide: false,
        subMenus : [
            {
                title : 'Settlement',
                href : ADMIN_BASE_URL + '/finance/settlement',
                isHide: false
            },
            {
                title : 'Pengembalian Dana',
                href : ADMIN_BASE_URL + '/finance/refund',
                isHide: false,
            },
            {
                title : 'Setoran',
                href : ADMIN_BASE_URL + '/finance/deposit',
                isHide: false,
                subMenus : [
                    // {
                    //     title : 'AKAP',
                    //     href : ADMIN_BASE_URL + '/finance/deposit/intercity'
                    // },
                    {
                        title : 'Pemadumoda',
                        href : ADMIN_BASE_URL + '/finance/deposit/commuter',
                        isHide: false
                    }
                ]
            },
            {
                title : 'Transaksi',
                href : ADMIN_BASE_URL + '/finance/transaction',
                isHide: false,
                subMenus : [
                    {
                        title : 'Pemadumoda',
                        href : ADMIN_BASE_URL + '/finance/transaction/commuter',
                        isHide: false,
                    }
                ]
            },
            {
                title : 'Deposit',
                href : ADMIN_BASE_URL + '/finance/topup',
                isHide: false
            },
            {
                title : 'Emoney',
                href : ADMIN_BASE_URL + '/finance/emoney',
                isHide: false
            },
            {
                title : 'Bukti Bayar Rpayku',
                href : ADMIN_BASE_URL + '/finance/evidence-rpayku',
                isHide: false
            }
        ]
    },
    // {
    //     title : 'Marketing & Support',
    //     href : ADMIN_BASE_URL + '/marketing-and-support',
    //     icon : <BsTag/>
    // },
    {
        title : 'Laporan',
        href : ADMIN_BASE_URL + '/report',
        icon : <BsFileText/>,
        isHide: false,
        subMenus : [
            {
                title : 'Setoran',
                href : ADMIN_BASE_URL + '/report/deposit',
                isHide: false,
                subMenus : [
                    {
                        title : 'Pemadumoda',
                        href : ADMIN_BASE_URL + '/report/deposit/commuter',
                        isHide: false
                    },
                    {
                        title : 'AKAP',
                        href : ADMIN_BASE_URL + '/report/deposit/akap',
                        isHide: false
                    },
                    {
                        title : 'Harian',
                        href : ADMIN_BASE_URL + '/report/deposit/daily',
                        isHide: false
                    }
                ]
            },
            {
                title : 'Transaksi',
                href : ADMIN_BASE_URL + '/report/transaction',
                isHide: false,
                subMenus : [
                    {
                        title : 'Pemadumoda',
                        isHide: false,
                        href : ADMIN_BASE_URL + '/report/transaction/commuter'
                    },
                    {
                        title : 'Penjualan Loket',
                        href : ADMIN_BASE_URL + '/report/transaction/airport',
                        isHide: false,
                    },
                    {
                        title : 'Penjualan Shift',
                        href : ADMIN_BASE_URL + '/report/transaction/shift',
                        isHide: false,
                    },
                    {
                        title : 'Penjualan Harian',
                        href : ADMIN_BASE_URL + '/report/transaction/daily',
                        isHide: false,
                    },
                    {
                        title : 'Zonasi',
                        href : ADMIN_BASE_URL + '/report/transaction/zone',
                        isHide: false,
                    }
                ]
            },
            {
                title : 'Pendapatan',
                href : ADMIN_BASE_URL + '/report/sales',
                isHide: false,
            },
            {
                title : 'Asuransi',
                href : ADMIN_BASE_URL + '/report/insurance',
                isHide: false,
            },
            {
                title : 'Promo',
                href : ADMIN_BASE_URL + '/report/promo',
                isHide: false,
            },
            {
                title : 'Settlement Penyedia',
                href : ADMIN_BASE_URL + '/report/settlement-vendor',
                isHide: false,
            },
        ]
    },
    {
        title : 'Marketing & Support',
        href : ADMIN_BASE_URL + '/marketing-and-support',
        icon : <BsFileText/>,
        isHide: false,
        subMenus : [
            {
                title : 'Marketing Promo',
                href : ADMIN_BASE_URL + '/marketing-and-support/support/marketing',
                isHide: false,
                subMenus : [
                    {
                        title : 'Promo',
                        href : ADMIN_BASE_URL + '/marketing-and-support/marketing/promo',
                        isHide: false
                    },
                    {
                        title : 'Loyalty Point',
                        href : ADMIN_BASE_URL + '/marketing-and-support/marketing/loyalty-point',
                        isHide: false
                    },
                    {
                        title : 'Referral',
                        href : ADMIN_BASE_URL + '/marketing-and-support/marketing/referral',
                        isHide: false
                    }
                ]
            },
            {
                title : 'Berita',
                href : ADMIN_BASE_URL + '/marketing-and-support/news',
                isHide: false,
            },
            {
                title : 'Broadcast',
                href : ADMIN_BASE_URL + '/marketing-and-support/broadcast',
                isHide: false,
            },
            {
                title : 'Tema Apps',
                href : ADMIN_BASE_URL + '/marketing-and-support/theme',
                isHide: false,
            },
            {
                title : 'Voucher',
                href : ADMIN_BASE_URL + '/marketing-and-support/voucher-jrc',
                isHide: false,
            }
        ]
    },
    {
        title : 'Operasional',
        href : ADMIN_BASE_URL + '/operasional',
        icon : <BsFileText/>,
        isHide: false,
        subMenus : [
            {
                title : 'Setoran',
                href : ADMIN_BASE_URL + '/operation/deposit',
                isHide: false,
            },
            {
                title : 'Penugasan',
                href : ADMIN_BASE_URL + '/operation/assign-task',
                isHide: false,
            },
            {
                title : 'New Penugasan',
                href : ADMIN_BASE_URL + '/operation/assignment',
                isHide: false,
            }
        ]
    },
    {
        title : 'Modul WhatsApp',
        href : ADMIN_BASE_URL + '/modul-whatsapp',
        icon : <BsWhatsapp/>,
        isHide: false,
    },
    {
        title : 'Sandbox Newticket',
        href : ADMIN_BASE_URL + '/sandbox',
        icon : <BsWhatsapp/>,
        isHide: false,
    },
]