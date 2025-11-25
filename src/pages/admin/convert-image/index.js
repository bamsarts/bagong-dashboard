import AdminLayout from "../../../components/AdminLayout";
import Main, {popAlert} from '../../../components/Main'
import { Col, Row } from '../../../components/Layout'
import { useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'
import { postJSON, get, BASE_URL, objectToParams, paramsToObject, API_ENDPOINT } from '../../../api/utils'

export default function ConvertImage(){
    

    return (
        <Main>
            <AdminLayout
            headerContent={(
                <div
                style={{
                    color: "#fff"
                }}
                >
                    <small>Didukung oleh <a href={"https://imagestool.com/webp2jpg-online/"} target="_blank">imagestool.com</a></small>
                </div>
            )}
            >
                <Row
                center
                >
                  

                        <iframe
                        src={"https://imagestool.com/webp2jpg-online/"}
                        allowtransparency={true}
                        allowfullscreen={true} 
                        frameborder={0} 
                        height={1200}
                        width={"100%"}
                        >

                        </iframe>


                </Row>
            </AdminLayout>
        </Main>
    )
}