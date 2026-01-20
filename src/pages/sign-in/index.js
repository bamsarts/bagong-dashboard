import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'

import Main, { popAlert } from '../../components/Main'
import { Row, Col } from '../../components/Layout'
import Card from '../../components/Card'
import Input from '../../components/Input'
import Button from '../../components/Button'

import { postJSON, get } from '../../api/utils'
import { resetCookie, setCookie } from '../../utils/cookie'
import { getSessionStorage, setSessionStorage } from '../../utils/session-storage'
import { getLocalStorage, setLocalStorage } from '../../utils/local-storage'
import styles from './SignIn.module.scss'
import { setConfig } from 'next/config'

export default function SignIn(props) {

    const router = useRouter()

    const [_credentials, _setCredentials] = useState({
        username: '',
        password: ''
    })
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isShowPassword, _setIsShowPassword] = useState(false)
    const [_logo, _setLogo] = useState("")
    const [_isDev, _setIsDev] = useState(false)

    useEffect(() => {
        resetCookie(window.document.cookie)

        var username = document.getElementById("username").value
        var password = document.getElementById("password").value

        _setCredentials({
            username: username,
            password: password
        })


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
                _setIsDev(true)
            } else {
                _setLogo("/assets/logo/bisku.png")
            }
        }

    }, [])

    function validateToken(token) {
        const allowedRole = [2, 5, 8, 12, 99, 9, 13]
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload)
        let isAllow = false

        allowedRole.forEach(function (val, key) {
            if (val == payload.role_id) {
                isAllow = true
            }
        })

        setCookie('role_damri_dashboard', payload.role_id)

        return isAllow
    }

    function validateRole(roleId) {
        const allowedRole = [2, 5, 8, 12, 99, 9, 13]
        let isAllow = true
        allowedRole.forEach(function (val, key) {
            if (val == roleId) {
                isAllow = true
            }
        })

        setCookie('role_damri_dashboard', roleId)

        return isAllow
    }

    useEffect(() => {
        console.log(_isShowPassword)
    }, [_isShowPassword])

    async function _checkProfile(token, redirect) {
        if (!token) {
            throw new Error('unauthorized')
        }

        try {
            const profile = await get('/user/profile', token)
            // const company = await get('/masterData/profile', token)

            // let tempCompany = []

            // company.data.forEach(function (val, key) {
            //     if (key < 6) {
            //         tempCompany.push(val)
            //     }
            // })

            setCookie('profile_damri', JSON.stringify(profile.data))
            // setCookie('company_damri', JSON.stringify(tempCompany))

            if (profile) {
                window.location.replace('/admin/' + redirect)
            }

        } catch (e) {
            console.log("error check profile")
        }

    }

    async function _signin() {
        if (!_credentials.username || !_credentials.password) {
            popAlert({ message: 'Lengkapi Credential Anda' })
            return false
        }
        _setIsProcessing(true)
        try {
            // const res = await postJSON('/dashboard/signin', _credentials)
            const res = await postJSON('/dashboard/signin', _credentials)

            if (validateRole(res.data.roleId)) {
                setCookie('token', res.data.token)
                setCookie('branch', JSON.stringify(res.data.branchInfo))
                setCookie('counter', JSON.stringify(res.data.counterInfo))
                setCookie('member_damri', JSON.stringify({
                    "id": res.data.memberId,
                    "name": res.data.member
                }))

                let roleData = []
                let redirect = ""

                if (res.data?.roleData) {
                    res.data.roleData.forEach(function (val, key) {

                        // if(key < 50){
                        if (val.viewRole) {
                            roleData.push(val)
                            if (redirect != "dashboard") {
                                if (val.menu == "Laporan>Asuransi") {
                                    redirect = "report/insurance"
                                }

                                if (val.menu == "Master Data>User & Role Akses>Keanggotaan") {
                                    redirect = "master-data/user-and-access-role/membership"
                                }

                                if (val.menu == "Marketing & Support>Berita") {
                                    redirect = "marketing-and-support/news"
                                }
                            }
                        }

                        if (val.menu == "Dashboard" && val.viewRole) {
                            redirect = "dashboard"
                        }
                        // }

                    })
                }

                setLocalStorage("access_menu_damri", JSON.stringify(roleData))
                _checkProfile(res.data.token, (redirect == "" ? 'dashboard' : redirect))

            } else {
                popAlert({ message: "Akun tidak diizinkan akses" })
            }


        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Main>
            <div
                className={styles.container}
            >
                <form
                    className={styles.wrapper}
                    onSubmit={e => {
                        e.preventDefault()
                        _signin()
                    }}
                    action={'.'}
                >
                    <input type={'submit'} />
                    <div
                        className={styles.logo_container}
                    >
                        <img
                            src={_logo}
                            className={styles.logo}
                        />

                        {
                            _isDev && (
                                <h3>
                                    Development
                                </h3>
                            )
                        }
                    </div>

                    <Card>
                        <div
                            className={styles.auth_form_wrapper}
                        >
                            <h3>
                                E-ticket Management System
                            </h3>

                            <Row
                                marginBottom
                            >
                                <Col
                                    withPadding
                                    column={6}
                                >
                                    <Input
                                        id="username"
                                        placeholder={'Username'}
                                        value={_credentials.username}
                                        onChange={username => _setCredentials(credentials => {
                                            return {
                                                ...credentials,
                                                username
                                            }
                                        })}
                                    />
                                </Col>
                                <Col
                                    withPadding
                                    column={6}
                                >
                                    <Input
                                        id="password"
                                        placeholder={'Password'}
                                        value={_credentials.password}
                                        onChange={password => _setCredentials(credentials => {
                                            return {
                                                ...credentials,
                                                password
                                            }
                                        })}
                                        type={_isShowPassword ? 'text' : 'password'}
                                    />
                                </Col>
                                <Col
                                    withPadding
                                    column={6}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        onChange={() => _setIsShowPassword(!_isShowPassword)}
                                    >
                                    </input>

                                    <span
                                        style={{ "marginLeft": ".5rem" }}
                                    >
                                        Tampilkan Password
                                    </span>
                                </Col>
                            </Row>
                            <Row
                                center
                                verticalCenter
                            >
                                <Button
                                    title={'Sign in'}
                                    onClick={_signin}
                                    onProcess={_isProcessing}
                                    rounded
                                />
                            </Row>
                        </div>
                    </Card>


                </form>
            </div>
        </Main>
    )

}