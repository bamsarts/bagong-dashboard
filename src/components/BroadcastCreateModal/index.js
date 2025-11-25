import { useEffect, useState, useContext} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import {AiOutlinePlus} from 'react-icons/ai'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import { Col, Row } from '../Layout'
import Datepicker from '../Datepicker'
import Label from '../Label'
import { dateFilter } from '../../utils/filters'


const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: () => null,
}

BroadcastCreateModal.defaultProps = defaultProps

export default function BroadcastCreateModal(props = defaultProps){
   
    const CONFIG_PARAM = {
        "type": "APPS",
        "title": "",
        "banner": "",
        "deepLink": "",
        "startAt": dateFilter.basicDate(new Date()).normal,
        "endAt": dateFilter.basicDate(new Date()).normal,
        "timeStartAt": dateFilter.getTime(new Date(addMinutes(5))),
        "timeEndAt": dateFilter.getTime(new Date(addMinutes(10))),
        "titleDeeplink": "",
        "urlDeeplink": "",
        "isAllUser": true
    }

    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const titleModal = props.data?.id ? 'Ubah Broadcast' : 'Tambah Broadcast'

    useEffect(() => {
        if(props.data?.id){

            let deeplink = {}

            if(props.data?.type == "APPS" && props.data.deep_link){
                deeplink = JSON.parse(props.data?.deep_link)
            }
           
            _updateQuery({
                ...props.data,
                "timeStartAt": props.data?.start_at.split(" ")[1].slice(0, -3),
                "timeEndAt": props.data?.end_at.split(" ")[1].slice(0, -3),
                "deepLink": props.data?.deep_link,
                "titleDeeplink": deeplink.title,
                "urlDeeplink": deeplink?.url ? decodeURIComponent(`${deeplink.url}`) : props.data?.deep_link
            })

        }

    }, [props.data])

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function addMinutes(minutes) {
        let date = new Date()

        date.setMinutes(date.getMinutes() + minutes);  return date;
    }

    function _clearForm(){
        _setForm(CONFIG_PARAM)
    }

    function removeTags(str) {
        if ((str === null) || (str === ''))
            return false;
        else
            str = str.toString();
    
        // Regular expression to identify HTML tags in
        // the input string. Replacing the identified
        // HTML tag with a null string.
        return str.replace(/(<([^>]+)>)/ig, '');
    }

    function validHTML(html) {
        var openingTags, closingTags;
      
        html        = html.replace(/<[^>]*\/\s?>/g, '');      // Remove all self closing tags
        html        = html.replace(/<(br|hr|img).*?>/g, '');  // Remove all <br>, <hr>, and <img> tags
        openingTags = html.match(/<[^\/].*?>/g) || [];        // Get remaining opening tags
        closingTags = html.match(/<\/.+?>/g) || [];           // Get remaining closing tags
      
        return openingTags.length === closingTags.length ? true : false;
    }

    async function _submitData(isDuplicate = false){
            
        
        let query  = {
            ..._form,
        }

        let typeUrl = props.data?.id ? "update" : "add"
        
        query.startAt = query.startAt + " " + query.timeStartAt+":00"
        query.endAt = query.endAt + " " + query.timeEndAt+":00"

        if(!query.deepLink) delete query.deepLink

        if(query.urlDeeplink && query.type == "APPS"){
            let link = {
                "navigationId": "webview",
                "title": query.titleDeeplink,
                "url": encodeURIComponent(query.urlDeeplink)
            }

            query.deepLink = JSON.stringify(link)

        }else{

            query.deepLink = query.urlDeeplink
        }

        if(query.type == "APPS"){
            query.body = removeTags(query.body)
        }

        if(isDuplicate){
            typeUrl = "add"
            delete query.id
        }

        delete query.titleDeeplink
        delete query.urlDeeplink
        delete query.timeStartAt
        delete query.timeEndAt
        delete query.deeplink
        delete query.is_active
        delete query.is_running
        delete query.deep_link
        delete query.start_at
        delete query.end_at
        
        _setIsProcessing(true)

        try{
            
            const result = await postJSON('/masterData/broadcast/'+typeUrl, query, appContext.authData.token)
            
            if(result) props.closeModal()
            _clearForm()
            popAlert({"message": "Berhasil disimpan", "type": "success"})
            props.onSuccess()
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    return (
        <Modal
        extraLarge
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: titleModal,
                closeModal: () => {
                    props.closeModal()
                    _clearForm()
                },
            }}
            >

                <Row
                withPadding
                >
                    <Col
                    column={3}
                    >
                        <p
                        style={{
                            marginBottom: "1rem"
                        }}
                        >
                            Jenis
                        </p>

                        <Label
                        activeIndex={_form.type}
                        labels={[
                            {
                                class: "primary",
                                title: 'Damri Apps',
                                value: "APPS",
                                onClick : () => {
                                    _updateQuery({
                                        "type": "APPS",
                                    })
                                }
                            },
                            {
                                class: "primary",
                                title: 'Email',
                                value: "EMAIL",
                                onClick : () => {
                                    _updateQuery({
                                        "type": "EMAIL",
                                    })
                                }
                            },
                            
                        ]}
                        />

                        <Input
                        withMargin
                        title={"Judul Broadcast"}
                        value={_form.title}
                        onChange={(value) => {
                            _updateQuery({
                                "title": value
                            })
                        }}
                        />

                        <Input
                        multiline={3}
                        withMargin
                        title={"Body"}
                        value={_form.body}
                        onChange={(value) => {
                            _updateQuery({
                                "body": value
                            })
                        }}
                        />

                        <Row
                        verticalCenter
                        >
                            <Col
                            
                            >
                                <Input
                                withMargin
                                title={"Gambar Banner"}
                                value={_form.banner}
                                onChange={(value) => {
                                    _updateQuery({
                                        "banner": value
                                    })
                                }}
                                />

                            </Col>

                            <Col
                            column={1}
                            alignEnd
                            >
                                <Button
                                small
                                title={'Media S3'}
                                onClick={() => {
                                    props.triggerOpen()
                                }}
                                />
                            </Col>
                        </Row>
                        
                
                        <div
                        style={{
                            "margin": "1rem .5rem .5rem .5rem"
                        }}
                        >
                            Deeplink
                        </div>
                
                        <Row>
                            <Col
                            withPadding
                            >
                                {
                                    (_form.type == "APPS") && (
                                        <Input
                                        withMargin
                                        title={"Judul"}
                                        value={_form.titleDeeplink}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "titleDeeplink": value
                                            })
                                        }}
                                        />
                                    )
                                }
                            
                                <Input
                                multiline={3}
                                withMargin
                                title={"Link"}
                                value={_form.urlDeeplink}
                                onChange={(value) => {
                                    _updateQuery({
                                        "urlDeeplink": value
                                    })
                                }}
                                />

                            </Col>
                        </Row>

                
                        <Row>
                            
                            <Col
                            column={3}
                            >
                                <Datepicker
                                withMargin
                                id={"startAt"}
                                title={"Dari Tanggal"}
                                value={_form.startAt}
                                onChange={date => {
                                    _updateQuery({
                                        "startAt": dateFilter.basicDate(new Date(date)).normal
                                    })
                                }}
                                />
                            </Col>

                            <Col
                            column={2}
                            >
                                <Input
                                withMargin
                                maxLength={5}
                                title={"Jam:Menit"}
                                placeholder={'00:00'}
                                value={_form.timeStartAt}
                                onChange={(value) => {
                                    _updateQuery({
                                        "timeStartAt": value
                                    })
                                }}
                                />
                            </Col>
                            
                           

                        </Row>

                        <Row
                        marginBottom
                        >
                            
                            <Col
                            column={3}
                            >
                                <Datepicker
                                withMargin
                                id={"endAt"}
                                title={"Sampai Tanggal"}
                                value={_form.endAt}
                                onChange={date => {
                                    _updateQuery({
                                        "endAt": dateFilter.basicDate(new Date(date)).normal
                                    })
                                }}
                                />
                            </Col>

                            <Col
                            column={2}
                            >
                                <Input
                                withMargin
                                maxLength={5}
                                title={"Jam:Menit"}
                                placeholder={'00:00'}
                                value={_form.timeEndAt}
                                onChange={(value) => {
                                    _updateQuery({
                                        "timeEndAt": value
                                    })
                                }}
                                />
                            </Col>
                        </Row>
                        

                        <p
                        style={{
                            marginBottom: "1rem"
                        }}
                        >
                            Target Pengguna
                        </p>

                        <Label
                        activeIndex={_form.isAllUser}
                        labels={[
                            {
                                class: "primary",
                                title: 'Semua Pengguna',
                                value: true,
                                onClick : () => {
                                    _updateQuery({
                                        "isAllUser": true,
                                    })
                                }
                            },
                            {
                                class: "secondary",
                                title: 'Pengguna Terpilih',
                                value: false,
                                onClick : () => {
                                    _updateQuery({
                                        "isAllUser": false,
                                    })
                                }
                            }
                        ]}
                        />

                        <Row
                        style={{
                            marginTop: "2rem"
                        }}
                        spaceBetween
                        >
                            <Col>
                                <Button
                                title={'Simpan'}
                                styles={Button.primary}
                                onClick={_submitData}
                                onProcess={_isProcessing}
                                />
                            </Col>
                            
                            {
                                props.data?.type && (
                                    <Col
                                    alignEnd
                                    >
                                        <Button
                                        icon={<AiOutlinePlus/>}
                                        title={'Simpan Baru'}
                                        styles={Button.secondary}
                                        onClick={() => {
                                            _submitData(true)
                                        }}
                                        onProcess={_isProcessing}
                                        />
                                    </Col>
                                )
                            }
                            
                        </Row>
                
                       
                    </Col>
                        
                    <Col
                    column={3}
                    >
                        {
                            _form.banner && (
                                <div
                                style={{
                                    "display": "grid"
                                }}
                                >
                                    <span>Banner</span>

                                    <img
                                    style={{
                                        "margin": "1rem 0rem"
                                    }}
                                    src={_form.banner}
                                    width={100}
                                    height={"auto"}
                                    />
                                </div>
                            )
                        }

                        {
                            _form.type == "EMAIL" && (
                                <div
                                style={{
                                    "margin": "1rem 0rem"
                                }}
                                dangerouslySetInnerHTML={{ __html: _form.body }} 
                                />

                            )
                        }

                        {
                            _form.urlDeeplink && (
                                <iframe
                                src={_form.urlDeeplink}
                                allowtransparency={true}
                                allowfullscreen={true} 
                                frameborder={0} 
                                height={800}
                                width={"100%"}
                                >

                                </iframe>
                            )
                        }
                        
                    </Col>
                </Row>
               

                
                
            </ModalContent>
            
        </Modal>
    )
}