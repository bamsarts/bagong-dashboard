import styles from './Akdp.module.scss'

export default function Akdp() {
    // Define location hierarchy data
    const locations = [
        { name: 'MALANG', level: 0, bgColor: '' },
        { name: 'SINGOSARI', level: 1, bgColor: '' },
        { name: 'LAWANG', level: 2, bgColor: '' },
        { name: 'PURWODADI', level: 3, bgColor: '' },
        { name: 'PURWOSARI', level: 4, bgColor: '' },
        { name: 'SUKOREJO', level: 5, bgColor: '' },
        { name: 'SUWAYUWO', level: 6, bgColor: '' },
        { name: 'PANDAAN', level: 7, bgColor: '' },
        { name: 'APOLO', level: 8, bgColor: '' },
        { name: 'JAPANAN', level: 9, bgColor: '' },
        { name: 'PORONG', level: 10, bgColor: '' },
        { name: 'SURABAYA', level: 11, bgColor: '' }
    ];

    const summaryRows = [
        { label: 'Jumlah' },
        { label: 'Total (Ribuan)' }
    ];

    const cellStyle = {
        padding: '8px',
        border: '1px solid #ddd',
        fontSize: '11px',
        whiteSpace: 'nowrap'
    };

    return (
        <>
            <div className="print-container">
                <h3>FORM SETORAN BUS MALANG - SURABAYA</h3>

                <div className="row">
                    <div className="column">
                        <div>
                            <span>Tanggal</span>
                            <div className="form-underline">: </div>
                        </div>
                        <div>
                            <span>Nopol</span>
                            <div className="form-underline">: </div>
                        </div>
                        <div>
                            <span>RIT Ke</span>
                            <div className="form-underline">: </div>
                        </div>
                    </div>
                    <div className="column">
                        <div>
                            <span>Driver</span>
                            <div className="form-underline">: </div>
                        </div>
                        <div>
                            <span>Kondektur</span>
                            <div className="form-underline">: </div>
                        </div>
                        <div>
                            <span>Kernet</span>
                            <div className="form-underline">: </div>
                        </div>
                    </div>
                    <div className="column">
                        <div>
                            <span>JAM SETOR</span>
                            <div className="form-underline">: </div>
                        </div>

                    </div>
                </div>

                <div className="row">
                    <div className="column">
                        <div>
                            <span>Nomor Karcis</span>
                            <div className="form-underline"></div>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        position: "relative"
                    }}
                >
                    <span>RIT PENUMPANG MALANG - SURABAYA</span>

                    <div
                        style={{
                            position: "absolute",
                            right: 0,
                            border: "1px solid black",
                            display: "grid",
                            textAlign: "center",
                            width: "200px"
                        }}
                    >
                        <span>Mandoran MLG</span>
                        <div
                            style={{
                                height: "100px",
                                borderBottom: "1px solid black"
                            }}
                        >

                        </div>

                        <span
                            style={{
                                height: "30px"
                            }}
                        >
                            Nama
                        </span>

                        <span
                            style={{
                                textAlign: "left"
                            }}
                        >
                            Muatan :
                        </span>
                    </div>

                    <table style={{ marginTop: "1rem", width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <tbody>
                            {locations.map((location, index) => (
                                <tr key={index}>
                                    {Array.from({ length: location.level }).map((_, i) => (
                                        <td key={`empty-${i}`} style={{ ...cellStyle, backgroundColor: 'transparent' }}></td>
                                    ))}
                                    <td style={{ ...cellStyle, backgroundColor: location.bgColor }}>
                                        {location.name}
                                    </td>
                                </tr>
                            ))}
                            {summaryRows.map((row, index) => (
                                <tr key={`summary-${index}`}>
                                    {Array.from({ length: 11 }).map((_, i) => (
                                        <td key={`empty-${i}`} style={{ ...cellStyle, backgroundColor: 'transparent' }}></td>
                                    ))}
                                    <td style={cellStyle}>{row.label}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>


            </div>
        </>
    )
}