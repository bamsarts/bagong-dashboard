import Main, {popAlert} from '../../components/Main'
import AdminLayout from '../../components/AdminLayout'
import { useEffect, useState, useContext } from 'react'
import { Col, Row } from '../../components/Layout'
import { postJSON, get, objectToParams, BASE_URL } from '../../api/utils'
import { useRouter } from 'next/router'

export default function Verification(props){

    const router = useRouter()

    useEffect(() => {
        getToken()
    }, [])  
    async function getToken() {
        try {

            const result = await get({
                url: `/api/api-server-side?url=${BASE_URL}/wabot/verification/get-token`
            })

            if(result.data.status == "OK"){
                _submitToken(result.data.data.token)
            }
           
        } catch (e) {
            popAlert({ message : e.message, duration: "10000" }) 
        }
    }

    async function _submitToken(token) {
       
        try {

            const result = await get({
                url: `/api/api-server-side?url=${BASE_URL}`+'/wabot/verification/submit/'+router.query?.type+"/"+router.query?.phone+"/"+router.query?.token+"&token="+token
            })

            if(router.query?.type != "refund"){
                if(result?.data?.status == "OK"){
                    popAlert({ message : "Verifikasi berhasil", type: 'success'}) 
    
                    window.location.href = "bagong://registerFinish"
                }
            }else{
                window.location.href = "/id/refund?"+objectToParams(router.query)
            }
           
            
            setTimeout(() => {
                window.open('','_self').close();
                window.close();
            }, 10000);

        } catch (e) {

            if(e.message == "Invalid Data (token)"){
                popAlert({ message : "Token sudah kadaluarsa", duration: "10000" }) 
            }else if(e.message == "Terverifikasi"){
                popAlert({ message : "Verifikasi berhasil", type: 'success'}) 

                if(router.query?.type != "refund"){
                    window.location.href = "bagong://registerFinish"
                }else{
                    window.location.href = "/id/refund?"+objectToParams(router.query)
                }
                
            }else{
                popAlert({ message : e.message, duration: "10000" }) 
            }

            setTimeout(() => {
                window.open('','_self').close();
                window.close();
            }, 10000);
            
        }
    }

    return (
        <Main>
            
            <AdminLayout>

                <Row
                center
                >
                    <Col
                    column={4}
                    mobileFullWidth
                    style={{
                        padding: "1rem"
                    }}
                    >

                        
                    </Col>
                   
                </Row>
            
            </AdminLayout>
        </Main>
    )
   
}