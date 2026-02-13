import Main, { popAlert } from '../../components/Main'
import { useEffect, useState } from 'react'
import { get, objectToParams, BASE_URL } from '../../api/utils'
import { useRouter } from 'next/router'
import Card from '../../components/Card'
import ActivityIndicator from '../../components/ActivityIndicator'

export default function Verification() {

    const router = useRouter()
    const [_logo, _setLogo] = useState("")
    const [_loading, _setLoading] = useState(true)
    const [_verificationStatus, _setVerificationStatus] = useState(null) // 'success', 'error', 'processing'
    const [_message, _setMessage] = useState("Memproses verifikasi...")

    useEffect(() => {

        if (typeof window !== 'undefined') {
            const subdomain = window.location.hostname.split('.')[0];
            const subSubDomain = window.location.hostname.split('.')[1];

            if (subdomain === "bisku" || window.location.hostname === 'localhost') {
                _setLogo("/assets/logo/bisku.png")

            } else if (subdomain === "bagong") {
                _setLogo("/assets/logo/bagong.svg")

            } else if (subdomain === "damri") {
                _setLogo("/assets/logo/damri.png")
            } else if (subdomain === "dev") {
                if (subSubDomain === "bagong") {
                    _setLogo("/assets/logo/bagong.svg")
                } else if (subSubDomain === "damri") {
                    _setLogo("/assets/logo/damri.png")
                } else {
                    _setLogo("/assets/logo/bisku.png")
                }
            } else {
                _setLogo("/assets/logo/bisku.png")
            }
        }

        _submitToken()
    }, [])


    async function _submitToken() {

        try {

            const result = await get({
                url: `/api/verification?type=${router.query?.type}&phone=${router.query?.phone}&token=${router.query?.token}`
            })

            if (router.query?.type != "refund") {
                if (result?.data?.status == "OK") {
                    _setLoading(false)
                    _setVerificationStatus('success')
                    _setMessage("Anda akan diarahkan ke Aplikasi")

                    setTimeout(() => {
                        window.location.href = "bagong://registerFinish"
                    }, 2000)
                }
            } else {
                _setLoading(false)
                _setVerificationStatus('success')
                _setMessage("Verifikasi berhasil! Mengarahkan ke halaman refund...")

                setTimeout(() => {
                    window.location.href = "/id/refund?" + objectToParams(router.query)
                }, 2000)
            }


            setTimeout(() => {
                window.open('', '_self').close();
                window.close();
            }, 10000);

        } catch (e) {
            _setLoading(false)
            _setVerificationStatus('error')

            if (e.message == "Invalid Data (token)") {
                _setMessage("Token sudah kadaluarsa")
                popAlert({ message: "Token sudah kadaluarsa", duration: "10000" })
            } else if (e.message == "Terverifikasi") {
                _setVerificationStatus('success')
                _setMessage("Verifikasi berhasil! Anda akan diarahkan...")
                popAlert({ message: "Verifikasi berhasil", type: 'success' })

                if (router.query?.type != "refund") {
                    setTimeout(() => {
                        window.location.href = "bagong://registerFinish"
                    }, 2000)
                } else {
                    setTimeout(() => {
                        window.location.href = "/id/refund?" + objectToParams(router.query)
                    }, 2000)
                }

            } else {
                _setMessage(e.message || "Terjadi kesalahan saat verifikasi")
                popAlert({ message: e.message, duration: "10000" })
            }

            setTimeout(() => {
                window.open('', '_self').close();
                window.close();
            }, 10000);

        }
    }

    return (
        <Main>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                padding: '20px'
            }}>
                <Card style={{ maxWidth: '500px', width: '100%' }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px'
                    }}>
                        {_logo && (
                            <img
                                src={_logo}
                                alt="Logo"
                                style={{
                                    maxWidth: '200px',
                                    height: 'auto',
                                    marginBottom: '30px'
                                }}
                            />
                        )}

                        {_loading && (
                            <div style={{ marginBottom: '20px' }}>
                                <ActivityIndicator />
                            </div>
                        )}

                        {_verificationStatus === 'success' && (
                            <div style={{ marginBottom: '20px' }}>
                                <svg
                                    width="80"
                                    height="80"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#4CAF50"
                                    strokeWidth="2"
                                    style={{ margin: '0 auto' }}
                                >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                        )}

                        {_verificationStatus === 'error' && (
                            <div style={{ marginBottom: '20px' }}>
                                <svg
                                    width="80"
                                    height="80"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#f44336"
                                    strokeWidth="2"
                                    style={{ margin: '0 auto' }}
                                >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                            </div>
                        )}

                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            marginBottom: '10px',
                            color: '#333'
                        }}>
                            {_verificationStatus === 'success' ? 'Verifikasi Berhasil' :
                                _verificationStatus === 'error' ? 'Verifikasi Gagal' :
                                    'Memverifikasi'}
                        </h2>

                        <p style={{
                            fontSize: '16px',
                            color: '#666',
                            lineHeight: '1.5'
                        }}>
                            {_message}
                        </p>

                        {_verificationStatus === 'error' && (
                            <p style={{
                                fontSize: '14px',
                                color: '#999',
                                marginTop: '20px'
                            }}>
                                Halaman ini akan tertutup otomatis dalam beberapa detik.
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </Main>
    )

}