import { useEffect, useState } from "react";
import AdminLayout from "../../../../components/AdminLayout";
import styles from './Media.module.scss'
import Main, { popAlert } from '../../../../components/Main'
import { postJSON, postFormData } from '../../../../api/utils'
import Card from '../../../../components/Card'
import { Row, Col } from '../../../../components/Layout'
import Input from '../../../../components/Input'
import Button from '../../../../components/Button'
import ImageSlider from '../../../../components/ImageSlider'
import MinioModal from "../../../../components/MinioModal";

export default function Media(props){
    const [_mediaRange, _setMediaRange] = useState([])
    const FORM = {
        "title": "",
        "file": ""
    }
    const [_form, _setForm] = useState(FORM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isDisabledForm, _setIsDisabledForm] = useState(true)
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_indexMedia, _setIndexMedia] = useState(0)
    const [_isOpenModalS3, _setIsOpenModalS3] = useState(false)

    useEffect(() => {
        _getMedia()
    }, [])

    async function _submitForm(){
        _setIsProcessing(true)
        try{
            const query = {
                ..._form
            }

            const result = await postFormData("/masterData/media/image/upload", {
                ...query
            }, props.authData.token)

            if(result) {
                popAlert({"message": "Berhasil di-upload", "type": "success"})
                _getMedia()
                _setForm(FORM)
                document.getElementById("form").reset()
            }
            
        }catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _getMedia(){
        
        let params = {
            startFrom : 0,
            length: 460,
            orderBy: "id",
            sortMode: "desc"
        }

        try {
            const res = await postJSON(`/masterData/media/image/list`, params, props.authData.token)
        
            if(res) {
                _setMediaRange(res.data)
            }

        } catch (e) {
            console.log(e)
        }
    }
    
    function _updateFormData(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        }) 
    }

    useEffect(() => {
        if(_form.title != "" && _form.file != ""){
            _setIsDisabledForm(false)
        }else{
            _setIsDisabledForm(true)
        }
    }, [_form])

    return (
        <Main>

            <ImageSlider
            visible={_isOpenModal}
            closeModal={
                () => {
                    _setIsOpenModal(false)
                }
            }
            data={_mediaRange}
            index={_indexMedia}
            />

            <MinioModal
            visible={_isOpenModalS3}
            closeModal={() => {
                _setIsOpenModalS3(false)
            }}
            />

            <AdminLayout>

                <Card>
                    <Row
                    verticalEnd
                    >
                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >   
                            <div>
                                <div
                                style={{"margin": "1rem 0rem 1.5rem 0rem"}}
                                >
                                    Title
                                </div>

                                <Input
                                placeholder={'Masukan Title'}
                                value={_form.title}
                                onChange={(value) => {
                                    _updateFormData({
                                        title: value
                                    })
                                }}
                                />
                            </div>
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <div>
                                <div
                                style={{"margin": "1rem 0rem 1.5rem 0rem"}}
                                >
                                    File
                                </div>

                                <form
                                id={"form"}
                                style={{"padding": ".5rem"}}
                                >
                                    <input
                                    style={{"width": "100%"}}
                                    type={'file'}
                                    accept={'.png, .jpg, .jpeg'}
                                    onChange={(e) => {
                                        _updateFormData({
                                            "file": e.target.files[0]
                                        })
                                    }}
                                    />
                                </form>
                            </div>
                           
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Button
                            disabled={_isDisabledForm}
                            title={'Upload'}
                            onProcess={_isProcessing}
                            onClick={() => {
                                _submitForm()
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Button
                            title={'Media S3'}
                            onClick={() => {
                                _setIsOpenModalS3(true)
                            }}
                            />
                        </Col>
                    </Row>
                </Card>
                <div
                className={styles.item_container}
                >
                    {
                        _mediaRange.map((val, key) => {
                            return (
                                <div
                                className={styles.column}
                                onClick={() => {
                                    _setIsOpenModal(true)
                                    _setIndexMedia(key)
                                }}
                                >   
                                    <div>
                                        <img src={val.thumbnail}></img>
                                    </div>
                            
                                    <span>{val.title}</span>
                                </div>
                            )
                        })
                    }

                </div>
            </AdminLayout>
        </Main>
    )
}