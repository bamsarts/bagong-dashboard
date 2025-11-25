import { useEffect, useState, useContext, forwardRef} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import generateClasses from '../../utils/generateClasses'
import { Col, Row } from '../Layout'
import Label from '../Label'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import { currency, dateFilter } from '../../utils/filters'
import MinioModal from '../MinioModal'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
}

ThemeModal.defaultProps = defaultProps

export default function ThemeModal(props = defaultProps){

    //logo 634x83
    //splash 1760x3840
    
    const appContext = useContext(AppContext)

    const CONFIG_PARAM = {
        "tema": "",
        "mainLogo": "",
        "mainScreen": "",
        "startDate": "",
        "endDate": "",
        "file": "",
        "fileMainScreen": "",
        "isActive": "true",
        "darkMode": "false",
        "promo_logo": "",
        "promo_base_color": "",
        "promo_banner": "",
        "category": "HOMESCREEN" 
    }

    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isOpenModalS3, _setIsOpenModalS3] = useState(false)

    const StartPeriodPicker = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Mulai Periode"}
            onClick={onClick}
            ref={ref}
            value={_form.startDate == "" ? "" : dateFilter.getMonthDate(_form.startDate)}
            onChange={(value) => {
              
            }}
            />
        </Col>
    ));

    const EndPeriodPicker = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Akhir Periode"}
            onClick={onClick}
            ref={ref}
            value={_form.endDate == "" ? "" : dateFilter.getMonthDate(_form.endDate)}
            onChange={(value) => {
              
            }}
            />
        </Col>
    ));

    const isValidUrl = (string) => {
        try {
            new URL(string)
            return true
        } catch (_) {
            return false
        }
    }

    function _clearForm(){
        _setForm(CONFIG_PARAM)
    }

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _isValidHexColor(hex){
        // Validate hex color format: #RGB, #RRGGBB, #RGBA, or #RRGGBBAA
        const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/
        return hexRegex.test(hex)
    }

    async function _getMedia(param){
        
        let params = {
            startFrom : 0,
            length: 1,
            orderBy: "id",
            sortMode: "desc"
        }

        try {
            const res = await postJSON(`/masterData/media/image/list`, params, appContext.authData.token)
        
            if(res.data) {
                _updateQuery({
                    [param]: res.data[0].link
                })
            }

        } catch (e) {
            console.log(e)
            _setIsProcessing(false)
        }
    }

    async function _uploadImage(file, nameFile){
        _setIsProcessing(true)

        let param = {
            "file": "mainLogo",
            "fileMainScreen": "mainScreen"
        }

        try{
            const query = {
                "title": nameFile,
                "file": file
            }

            const result = await postFormData("/masterData/media/image/upload", {
                ...query
            }, appContext.authData.token)

            if(result) {
                _getMedia(nameFile)
            }
            
        }catch(e){
            popAlert({ message : e.message })    
        } finally{
            _setIsProcessing(false)   
        }
                
    }

    async function _submitData(){

        _setIsProcessing(true)

        try{
            let query  = {
                ..._form
            }

            let typeUrl = props.data?.id ? "update" : "add"

            if(query?.promo_base_color){
                if(!_isValidHexColor(query.promo_base_color)){
                    popAlert({ 
                        message: "Format warna hex tidak valid. Gunakan format seperti #FFF atau #FFFFFF", 
                        type: "error" 
                    })

                    return false
                }

                query.mainLogo = "-"
                query.mainScreen = "-"
            }

            query.startDate = dateFilter.basicDate(query.startDate).normal
            query.endDate = dateFilter.basicDate(query.endDate).normal

            delete query.file
            delete query.fileMainScreen
            delete query.updatedAt
            delete query.updatedBy
            delete query.createdAt
            delete query.createdBy
            delete query.category

            const result = await postJSON('/masterData/tematik/apps/'+typeUrl, query, appContext.authData.token)
            
            if(result) props.closeModal()
            _clearForm()
            popAlert({"message": "Berhasil disimpan", "type": "success"})
            props.onSuccess()
        } catch(e){
            let errMessage = ""
            if(e.message?.details){
                errMessage = e.message.details[0].message
            }else{
                errMessage = e.message
            }
            popAlert({ message : errMessage })       
        } finally{
            _setIsProcessing(false)
        }
    }

    useEffect(() => {
        if(props.data?.id){
            var update = {
                ...props.data,
            }
    
            if(update.startDate){
                update.startDate = new Date(update.startDate)
                update.endDate = new Date(update.endDate)
            }

            if(update?.promo_logo){
                update.category = "SLIDEPROMO"
            }
    
            update.isActive = update.isActive == 1 ? "true" : "false"
            update.darkMode = update.darkMode == 1 ? "true" : "false"
            
            _updateQuery(update)
        }
    }, [props.data])


    return (

        <Modal
        visible={props.visible}
        centeredContent
        >
            <MinioModal
            visible={_isOpenModalS3}
            closeModal={() => {
                _setIsOpenModalS3(false)
            }}
            />

            <ModalContent
            header={{
                title: props.data.id ? 'Ubah Tema' : 'Tambah Tema',
                closeModal: () => {
                    props.closeModal()
                    _clearForm()
                },
            }}
            >

                <Row>
                    <Col
                    column={6}
                    >
                        
                        <div>
                            <p
                            style={{
                                marginBottom: "1rem"
                            }}
                            >
                                Kategori Voucher
                            </p>

                            <Label
                                activeIndex={_form.category}
                                labels={[
                                    {
                                        class: "warning",
                                        title: 'Homescreen',
                                        value: "HOMESCREEN",
                                        onClick: () => {
                                            _updateQuery({
                                                "category": "HOMESCREEN"
                                            })
                                        }
                                    },
                                    {
                                        class: "primary",
                                        title: 'Slide Promo',
                                        value: "SLIDEPROMO",
                                        onClick: () => {
                                            _updateQuery({
                                                "category": "SLIDEPROMO"
                                            })
                                        }
                                    }
                                ]}
                            />
                        </div>

                        <Row
                        verticalEnd
                        style={{
                            gap: "1rem",
                            margin: ".5rem"
                        }}
                        >
                            <Input
                            title={"Nama Tema"}
                            value={_form.tema}
                            onChange={(value) => {
                                _updateQuery({
                                    "tema": value
                                })
                            }}
                            />

                            <Button
                            small
                            title={'Media S3'}
                            onClick={() => {
                                _setIsOpenModalS3(true)
                            }}
                            />
                        </Row>
                       
                        {
                            (isValidUrl(_form.mainLogo) || _form.category == "HOMESCREEN") && (
                                <div>

                                    {
                                        _form.mainLogo && (
                                            <img
                                            src={_form.mainLogo+"?option=thumbnail&size=50"}
                                            width={"100"}
                                            height={"auto"}
                                            />
                                        )
                                    }
                                   
                                    
                                    <Input
                                    withMargin
                                    title={"Logo Homescreen"}
                                    value={_form.mainLogo}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "mainLogo": value
                                        })
                                    }}
                                    />
                                
                                </div>
                            )
                        }

                        {
                            (isValidUrl(_form.mainScreen) || _form.category == "HOMESCREEN") && (
                                <div>

                                    {
                                        _form.mainScreen && (
                                            <img
                                            src={_form.mainScreen+"?option=thumbnail&size=50"}
                                            width={"100"}
                                            height={"auto"}
                                            />
                                        )
                                    }
                                   

                                    <Input
                                    withMargin
                                    title={"Background Homescreen"}
                                    value={_form.mainScreen}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "mainScreen": value
                                        })
                                    }}
                                    />
                                
                                </div>
                            )
                        }
                        

                        {
                            (_form.promo_banner || _form.category == "SLIDEPROMO") && (
                                <>
                                    <Row
                                    verticalEnd
                                    style={{
                                        gap: "1rem",
                                        margin: ".5rem"
                                    }}
                                    >
                                        <Input
                                        title={"Base Hexa Color"}
                                        value={_form.promo_base_color}
                                        onChange={(value) => {
                                        _updateQuery({
                                                "promo_base_color": value
                                            })
                                        }}
                                        />
                                        
                                        <div
                                        style={{
                                            height: "30px",
                                            width:"40px",
                                            backgroundColor: _form.promo_base_color
                                        }}
                                        >

                                        </div>
                                    </Row>

                                    {
                                        _form.promo_logo && (
                                            <img
                                            src={_form.promo_logo}
                                            width={"100"}
                                            height={"auto"}
                                            />
                                        )
                                    }

                                    <Input
                                    withMargin
                                    title={"Promo Logo"}
                                    value={_form.promo_logo}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "promo_logo": value
                                        })
                                    }}
                                    />

                                     {
                                        _form.promo_banner && (
                                            <img
                                            src={_form.promo_banner}
                                            width={"100"}
                                            height={"auto"}
                                            />
                                        )
                                    }

                                    <Input
                                    withMargin
                                    title={"Promo Banner"}
                                    value={_form.promo_banner}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "promo_banner": value
                                        })
                                    }}
                                    />

                                </>
                            )
                        }

                       
                        <Row>
                            <Col
                            column={3}
                            >
                                <DatePicker
                                style={{
                                    width: "100%"
                                }}
                                selected={_form.startDate}
                                onChange={(date) => {
                                    _updateQuery({
                                        "startDate": date
                                    })
                                }}
                                customInput={<StartPeriodPicker/>}
                                />
                            </Col>

                            <Col
                            column={3}
                            >
                                <DatePicker
                                style={{
                                    width: "100%"
                                }}
                                selected={_form.endDate}
                                onChange={(date) => {
                                    _updateQuery({
                                        "endDate": date
                                    })
                                }}
                                customInput={<EndPeriodPicker/>}
                                />
                            </Col>
                        </Row>
                           
                        <div
                        style={{
                            margin: ".5rem"
                        }}
                        >                        
                            <p
                            style={{
                                margin: "1rem 0rem"
                            }}
                            >
                                Mode
                            </p>

                            <Label
                            activeIndex={_form.darkMode}
                            labels={[
                                {
                                    class: "warning",
                                    title: 'Gelap',
                                    value: "true",
                                    onClick : () => {
                                        _updateQuery({
                                            "darkMode": "true",
                                        })
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Terang',
                                    value: "false",
                                    onClick : () => {
                                        _updateQuery({
                                            "darkMode": "false",
                                        })

                                    }
                                }
                            ]}
                            />
                        </div>
                        
                        <div
                        style={{
                            margin: ".5rem"
                        }}
                        >                        
                            <p
                            style={{
                                margin: "1rem 0rem"
                            }}
                            >
                                Aktif
                            </p>

                            <Label
                            activeIndex={_form.isActive}
                            labels={[
                                {
                                    class: "warning",
                                    title: 'Tidak',
                                    value: "false",
                                    onClick : () => {
                                        _updateQuery({
                                            "isActive": "false",
                                        })
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Ya',
                                    value: "true",
                                    onClick : () => {
                                        _updateQuery({
                                            "isActive": "true",
                                        })

                                    }
                                }
                            ]}
                            />
                        </div>
                        
                        <div
                        style={{
                            margin: "1rem 0rem 0rem .5rem"
                        }}
                        >
                            <Button
                            title={'Simpan'}
                            styles={Button.secondary}
                            onClick={_submitData}
                            onProcess={_isProcessing}
                            />
                        </div>
                        

                    </Col>

                </Row>

                
                

            </ModalContent>

        </Modal>
    )
}