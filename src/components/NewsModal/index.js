import { useEffect, useState, useContext, forwardRef } from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import Button from '../Button'
import { postJSON, postFormData, WEB_DAMRI, BUCKET, get, objectToParams } from '../../api/utils'
import AppContext from '../../context/app'
import generateClasses from '../../utils/generateClasses'
import { Col, Row } from '../Layout'
import Label from '../Label'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import { currency, dateFilter } from '../../utils/filters'
import Wysiwyg from '../Wysiwyg'
import SelectArea from '../SelectArea'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
    isImport: false,
    roleRange: [],
    rangeNews: []
}

NewsModal.defaultProps = defaultProps

export default function NewsModal(props = defaultProps) {

    const appContext = useContext(AppContext)

    const CONFIG_PARAM = {
        "companyId": appContext.authData.companyId,
        "title": "",
        "imageLink": "",
        "articleDate": "",
        "linkExternal": "",
        "category": "NEWS",
        "file": "",
        "isActive": "true",
        "isAlwaysShow": "false",
        "startPeriode": "",
        "endPeriode": "",
        "body": "",
        "tempBody": "",
        "subCategory": "",
        "tags": null,
        "filePdf": ""
    }

    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_articleDate, _setArticleDate] = useState(new Date())
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_tagsRange, _setTagsRange] = useState([
        {
            "title": "Damri",
        },
        {
            "title": "KSPN",
        },
        {
            "title": "Perintis",
        },
        {
            "title": "Jr Connexion",
        },
        {
            "title": "Lintas Negara",
        },
        {
            "title": "Antar Kota",
        },
        {
            "title": "Kota",
        },
        {
            "title": "Bandara",
        },
        {
            "title": "Pariwisata",
        },
        {
            "title": "Logistik",
        },
    ])
    const [_tagsSelected, _setTagsSelected] = useState([])

    const StartPeriodPicker = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                withMargin
                title={"Mulai Periode"}
                onClick={onClick}
                ref={ref}
                value={_form.startPeriode == "" ? "" : dateFilter.getMonthDate(_form.startPeriode)}
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
                value={_form.endPeriode == "" ? "" : dateFilter.getMonthDate(_form.endPeriode)}
                onChange={(value) => {

                }}
            />
        </Col>
    ));

    const DatePostPicker = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                withMargin
                title={"Tanggal Posting"}
                onClick={onClick}
                ref={ref}
                value={_form.articleDate == "" ? "" : dateFilter.getMonthDate(_form.articleDate)}
                onChange={(value) => {

                }}
            />
        </Col>
    ));

    const [_isChecked, _setIsChecked] = useState(false)

    function _handleChecked(state) {
        if (state) {
            if (_form.startPeriode) {
                const startDate = new Date(_form.startPeriode);
                const newEndDate = new Date(startDate.setFullYear(startDate.getFullYear() + 2));
                _updateQuery({
                    "endPeriode": newEndDate
                });
            }
        } else {
            _updateQuery({
                "endPeriode": _form.startPeriode
            });
        }
    }

    function _clearForm() {
        _setTagsSelected([])
        _setForm(CONFIG_PARAM)
        // Clear file input value if present
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = "";
        }

        _setIsChecked(false)
    }

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _getDetail() {

        let params = {
            startFrom: 0,
            length: 1,
            orderBy: "id",
            sortMode: "desc",
            id: props.data?.id
        }

        try {
            const res = await get(`/data/articleLink/list?` + objectToParams(params), appContext.authData.token)

            if (res.data) {
                let tags = []

                if (res.data[0].tags) {
                    res.data[0].tags.split(",").forEach(function (val, key) {
                        tags.push({
                            "title": val
                        })
                    })
                }

                _setTagsSelected(tags)
                _updateQuery(_setUpdate(res.data[0]))
                _updateQuery({
                    "tempBody": res.data[0].body
                })


            }

        } catch (e) {
            console.log(e)
            _setIsProcessing(false)
        }
    }


    async function _getMedia(length = 1) {

        let params = {
            startFrom: 0,
            length: length,
            orderBy: "id",
            sortMode: "desc"
        }

        try {
            const res = await postJSON(`/masterData/media/image/list`, params, appContext.authData.token)

            if (res) {
                if (length == 2) {
                    _submitData(res.data[1].link, res.data[0].link)
                } else {
                    _submitData(res.data[0].link)
                }
            }

        } catch (e) {
            console.log(e)
            _setIsProcessing(false)
        }
    }

    async function _uploadImage() {
        _setIsProcessing(true)

        if (_form.file == "" && _form.category != "MAJALAH") {
            _submitData(_form.imageLink)
            return false
        }

        if (_form.filePdf == "" && _form.file == "" && _form.category == "MAJALAH") {
            _submitData(_form.imageLink)
            return false
        }

        try {


            if (_form.file) {


                if (_form.category == "MAJALAH" && (_form.filePdf || _form.file)) {

                    let resCover = _form.file
                    let resPdf = _form.filePdf

                    if (_form.file) {
                        resCover = await _uploadS3(_form.file, _form.category)
                    }

                    if (_form.filePdf) {
                        resPdf = await _uploadS3(_form.filePdf, _form.category)
                    }

                    _submitData(BUCKET + resCover.key, BUCKET + resPdf.key)

                } else {
                    // Upload image file first
                    let res = await _uploadS3(_form.file, _form.category)

                    _submitData(BUCKET + res.key)
                }
            }

        } catch (e) {
            popAlert({ message: e.message })
            _setIsProcessing(false)
        } finally {
        }
    }

    async function _uploadS3(file, folder = "") {
        _setIsProcessing(true)

        try {

            const fd = new FormData();
            fd.append("file", file);
            fd.append("folder", folder)

            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            return data

        } catch (e) {
            popAlert({ message: e.message })
            _setIsProcessing(false)
        } finally {

        }
    }

    function _validateUrl(url) {
        if (!url) return url;

        // Remove any leading/trailing whitespace
        url = url.trim()

        // Check if URL starts with http:// or https://
        if (url.startsWith('http://') || url.startsWith('https://')) {

            return url

        } else {
            return url
        }
    }

    function textToSlug(text) {

        let idNews = parseInt(props.rangeNews?.id) + 1

        text = text
            .toString()
            .toLowerCase()
            .normalize('NFD') // split accented letters into base + diacritics
            .replace(/[\u0300-\u036f]/g, '') // remove diacritics
            .replace(/[^a-z0-9\s-]/g, '') // remove all non-alphanumeric chars except spaces and hyphens
            .replace(/\s+/g, '-') // replace spaces with hyphens
            .replace(/-+/g, '-') // collapse multiple hyphens
            .replace(/^-+|-+$/g, ''); // trim hyphens from start/end

        if (props.data?.category == "NEWS") {
            idNews = props.data?.id
        }

        _updateQuery({
            "linkExternal": _form.category == "NEWS" ? WEB_DAMRI + "/id/berita/" + (idNews) + "/" + text : _form.linkExternal
        })
    }

    function validateFilePdfSize(file, size = 300) {
        // 300 MB in bytes
        const MAX_SIZE = size * 1024 * 1024;
        if (!file) return true; // No file, so valid
        return file.size <= MAX_SIZE;
    }

    async function _submitData(image, linkPdf = null) {

        _setIsProcessing(true)

        try {
            let query = {
                ..._form
            }

            let typeUrl = props.data?.id ? "update" : "add"

            query.imageLink = image
            query.startPeriode = dateFilter.basicDate(query.startPeriode).normal
            query.endPeriode = dateFilter.basicDate(query.endPeriode).normal
            query.articleDate = dateFilter.basicDate(query.articleDate).normal

            if (query.category == "NEWS") {
                let tags = []

                _tagsSelected.forEach(function (val, key) {
                    tags.push(val.title)
                })

                query.tags = tags.length == 0 ? null : tags
            }

            if (query.linkExternal == "") query.linkExternal = "#"
            if (linkPdf) query.linkExternal = linkPdf
            if (!query.subCategory) delete query.subCategory

            delete query.file
            delete query.tempBody
            delete query.filePdf

            //temporary to produciton
            // delete query.body
            // delete query.tags
            // delete query.subCategory

            const result = await postJSON('/data/articleLink/' + typeUrl, query, appContext.authData.token, "PUT")

            if (result) props.closeModal()
            _clearForm()
            popAlert({ "message": "Berhasil disimpan", "type": "success" })
            props.onSuccess()
        } catch (e) {
            let errMessage = ""
            if (e.message?.details) {
                errMessage = e.message.details[0].message
            } else {
                errMessage = e.message
            }
            popAlert({ message: errMessage })
        } finally {
            _setIsProcessing(false)
        }
    }

    function _setUpdate(data) {
        var update = {
            ...data,
        }

        if (update.articleDate) {
            update.articleDate = new Date(update.articleDate)
            update.startPeriode = new Date(update.startPeriode)
            update.endPeriode = new Date(update.endPeriode)
        }

        update.isAlwaysShow = update.isAlwaysShow == 1 ? "true" : "false"
        update.isActive = update.isActive == 1 ? "true" : "false"

        return update
    }

    function _updateTags(data = {}, isDelete = false) {
        let tags = [..._tagsSelected]
        const index = _tagsSelected.indexOf(data)

        if (index < 0 && !isDelete) {
            tags.push(data)
        } else {
            tags.splice(index, 1)
        }

        _setTagsSelected(tags)
    }

    useEffect(() => {

        if (props.data?.category == "NEWS") {
            _getDetail()
        } else {
            _updateQuery(_setUpdate(props.data))
        }


    }, [props.data])

    useEffect(() => {

        if (_form.filePdf && _form.category == "MAJALAH") {
            _updateQuery({
                "linkExternal": ""
            })
        } else {
            textToSlug(_form.title)
        }

    }, [props.rangeNews, _form.title, _form.category, _form.filePdf])

    useEffect(() => {
        _updateQuery({
            "subCategory": ""
        })
    }, [_form.category])

    return (

        <Modal
            extraLarge
            visible={props.visible}
            centeredContent
        >
            <ModalContent
                header={{
                    title: props.data.id ? 'Ubah Konten' : 'Tambah Konten',
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
                            <div
                                style={{ "margin": "1rem 0rem 1.5rem 0rem" }}
                            >
                                Kategori
                            </div>

                            <div>
                                <input
                                    type="radio"
                                    value="NEWS"
                                    name="category"
                                    checked={_form.category == "NEWS"}
                                    onChange={() => {
                                        _updateQuery({
                                            "category": "NEWS"
                                        })
                                    }}
                                    style={{
                                        margin: "0rem 1rem"
                                    }}
                                />

                                Berita


                                <input
                                    type="radio"
                                    value="PROMOTION"
                                    name="category"
                                    style={{
                                        margin: "0rem 1rem"
                                    }}
                                    checked={_form.category == "PROMOTION"}
                                    onChange={() => {
                                        _updateQuery({
                                            "category": "PROMOTION"
                                        })
                                    }}
                                />
                                Promosi

                                <input
                                    type="radio"
                                    value="POPUP"
                                    name="category"
                                    style={{
                                        margin: "0rem 1rem"
                                    }}
                                    checked={_form.category == "POPUP"}
                                    onChange={() => {
                                        _updateQuery({
                                            "category": "POPUP"
                                        })
                                    }}
                                />
                                Pop Up Banner

                                <input
                                    type="radio"
                                    value="BANNER"
                                    name="category"
                                    style={{
                                        margin: "0rem 1rem"
                                    }}
                                    checked={_form.category == "BANNER"}
                                    onChange={() => {
                                        _updateQuery({
                                            "category": "BANNER"
                                        })
                                    }}
                                />
                                Banner

                                <input
                                    type="radio"
                                    value="MAJALAH"
                                    name="category"
                                    style={{
                                        margin: "0rem 1rem"
                                    }}
                                    checked={_form.category == "MAJALAH"}
                                    onChange={() => {
                                        _updateQuery({
                                            "category": "MAJALAH"
                                        })
                                    }}
                                />
                                Dokumen

                                <input
                                    type="radio"
                                    value="PENGHARGAAN"
                                    name="category"
                                    style={{
                                        margin: "0rem 1rem"
                                    }}
                                    checked={_form.category == "PENGHARGAAN"}
                                    onChange={() => {
                                        _updateQuery({
                                            "category": "PENGHARGAAN"
                                        })
                                    }}
                                />
                                Penghargaan


                            </div>
                        </div>

                        <Row>

                            <Col
                                column={2}
                            >
                                <div
                                    style={{ "margin": "1rem 0rem 0rem .5rem" }}
                                >
                                    Cover Gambar*
                                </div>

                                <form
                                    id={"form"}
                                    style={{ "padding": ".5rem" }}
                                >

                                    {
                                        _form?.id && (
                                            <img
                                                src={_form.imageLink + "?option=thumbnail&size=50"}
                                                width={"100"}
                                                height={"auto"}
                                            />
                                        )
                                    }

                                    <input
                                        style={{ "width": "100%" }}
                                        type={'file'}
                                        accept={'.png, .jpg, .jpeg, .webp'}
                                        onChange={(e) => {

                                            if (validateFilePdfSize(e.target.files[0], 1)) {
                                                _updateQuery({
                                                    "file": e.target.files[0]
                                                })
                                            } else {
                                                const fileInput = document.querySelector('input[type="file"]');
                                                if (fileInput) {
                                                    fileInput.value = "";
                                                }

                                                _updateQuery({
                                                    "file": ""
                                                })
                                                popAlert({ message: "Maksimal gambar 1 MB" })
                                            }
                                        }}
                                    />

                                    <div
                                        style={{
                                            display: "grid",
                                            fontSize: ".9rem",
                                            marginTop: "1rem"
                                        }}
                                    >
                                        <small>*Maksimal 1 MB disarankan format .webp</small>
                                        <a
                                            href="/admin/convert-image"
                                            target="_blank"
                                            style={{
                                                color: "blue"
                                            }}
                                        >
                                            Kompres gambar
                                        </a>
                                    </div>

                                </form>


                            </Col>

                            {
                                _form.category == "MAJALAH" && (
                                    <Col>
                                        <div
                                            style={{ "margin": "1rem 0rem 0rem .5rem" }}
                                        >
                                            File PDF*
                                        </div>

                                        <form
                                            id={"formPdf"}
                                            style={{ "padding": ".5rem" }}
                                        >
                                            <input
                                                style={{ "width": "100%" }}
                                                type={'file'}
                                                accept={'.pdf'}
                                                onChange={(e) => {

                                                    if (validateFilePdfSize(e.target.files[0])) {
                                                        _updateQuery({
                                                            "filePdf": e.target.files[0]
                                                        })
                                                    } else {
                                                        const fileInput = document.querySelector('input[type="file"]');
                                                        if (fileInput) {
                                                            fileInput.value = "";
                                                        }

                                                        _updateQuery({
                                                            "filePdf": ""
                                                        })
                                                        popAlert({ message: "Maksimum file 300 MB" })
                                                    }

                                                }}
                                            />

                                            <small>*Maksimum 300 MB</small>
                                        </form>
                                    </Col>
                                )
                            }


                        </Row>

                        <Input
                            multiline={2}
                            withMargin
                            title={"Judul Konten"}
                            value={_form.title}
                            onChange={(value) => {
                                _updateQuery({
                                    "title": value
                                })
                            }}
                        />

                        <Input
                            multiline={2}
                            withMargin
                            title={"Link"}
                            placeholder={"Url http"}
                            value={_form.linkExternal}
                            onChange={(value) => {
                                _updateQuery({
                                    "linkExternal": _validateUrl(value)
                                })
                            }}
                        />



                        {
                            _form.category == "POPUP" && (
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
                                        Selalu Muncul
                                    </p>

                                    <Label
                                        activeIndex={_form.isAlwaysShow}
                                        labels={[
                                            {
                                                class: "warning",
                                                title: 'Tidak',
                                                value: "false",
                                                onClick: () => {
                                                    _updateQuery({
                                                        "isAlwaysShow": "false",
                                                    })
                                                }
                                            },
                                            {
                                                class: "primary",
                                                title: 'Ya',
                                                value: "true",
                                                onClick: () => {
                                                    _updateQuery({
                                                        "isAlwaysShow": "true",
                                                    })

                                                }
                                            }
                                        ]}
                                    />
                                </div>
                            )
                        }


                        <Row>

                            <Col
                                column={1}
                            >
                                <DatePicker
                                    style={{
                                        width: "100%"
                                    }}
                                    selected={_form.articleDate}
                                    onChange={(date) => {
                                        _updateQuery({
                                            "articleDate": date
                                        })
                                    }}
                                    customInput={<DatePostPicker />}
                                />
                            </Col>

                            <Col
                                column={1}
                            >
                                <DatePicker
                                    style={{
                                        width: "100%"
                                    }}
                                    selected={_form.startPeriode}
                                    onChange={(date) => {
                                        _updateQuery({
                                            "startPeriode": date
                                        })
                                    }}
                                    customInput={<StartPeriodPicker />}
                                />
                            </Col>

                            <Col
                                column={1}
                            >
                                <DatePicker
                                    style={{
                                        width: "100%"
                                    }}
                                    selected={_form.endPeriode}
                                    onChange={(date) => {
                                        _updateQuery({
                                            "endPeriode": date
                                        })
                                    }}
                                    customInput={<EndPeriodPicker />}
                                />
                            </Col>

                            {
                                _form.startPeriode && (
                                    <Col
                                        justifyStart
                                        column={1}
                                    >
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <input
                                                type="checkbox"
                                                checked={_isChecked}
                                                onChange={e => {
                                                    const checked = e.target.checked;
                                                    _setIsChecked(checked);
                                                    _handleChecked(checked);
                                                }}
                                            />
                                            <span>Aktifkan 2 Tahun</span>
                                        </label>



                                        {/* </input>
                                        <Input
                                        type={"checkbox"}
                                        checked={_isChecked}
                                        value={_isChecked}
                                        onChange={(value) => {
                                            _setIsChecked(!value);
                                            _handleChecked(value);
                                        }}
                                        /> */}
                                    </Col>
                                )
                            }

                        </Row>

                        {
                            (_form.category == "NEWS" || _form.category == "MAJALAH" || _form.category == "BANNER") && (

                                <Row>
                                    <Col
                                        column={3}
                                    >
                                        <p
                                            style={{
                                                margin: "1rem 0rem"
                                            }}
                                        >
                                            Sub Kategori
                                        </p>

                                        <Label
                                            activeIndex={_form.subCategory}
                                            labels={[
                                                {
                                                    class: "primary",
                                                    title: 'Berita',
                                                    value: "BERITA",
                                                    isHide: _form.category == "NEWS" ? false : true,
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "subCategory": "BERITA",
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Launching',
                                                    value: "LAUNCHING",
                                                    isHide: _form.category == "NEWS" ? false : true,
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "subCategory": "LAUNCHING",
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'TJSL',
                                                    value: "TJSL",
                                                    isHide: _form.category == "NEWS" ? false : true,
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "subCategory": "TJSL",
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Tata Kelola Perusahaan',
                                                    value: "TATA KELOLA",
                                                    isHide: _form.category == "MAJALAH" ? false : true,
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "subCategory": "TATA KELOLA",
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Laporan Keberlanjutan',
                                                    value: "SUSTAINABILITY REPORT",
                                                    isHide: _form.category == "MAJALAH" ? false : true,
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "subCategory": "SUSTAINABILITY REPORT",
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Laporan Tahunan',
                                                    value: "ANNUAL REPORT",
                                                    isHide: _form.category == "MAJALAH" ? false : true,
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "subCategory": "ANNUAL REPORT",
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Logistik',
                                                    value: "LOGISTIK",
                                                    isHide: _form.category == "BANNER" ? false : true,
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "subCategory": "LOGISTIK",
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'UMUM',
                                                    value: "UMUM",
                                                    isHide: _form.category == "BANNER" ? false : true,
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "subCategory": "UMUM",
                                                        })
                                                    }
                                                }
                                            ]}
                                        />
                                    </Col>

                                    <Col>
                                        <SelectArea
                                            title={"Tag"}
                                            onSelect={(data) => {
                                                _updateTags(data, true)
                                            }}
                                            select={_tagsSelected}
                                        />

                                        <Input
                                            withMargin
                                            title={""}
                                            placeholder={'Pilih Tag'}
                                            value={_form.tags?.title}
                                            suggestions={_tagsRange}
                                            suggestionField={'title'}
                                            onSuggestionSelect={(data) => {
                                                _updateTags(data)
                                                return false
                                            }}
                                        />
                                    </Col>

                                </Row>
                            )
                        }



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
                                        onClick: () => {
                                            _updateQuery({
                                                "isActive": "false",
                                            })
                                        }
                                    },
                                    {
                                        class: "primary",
                                        title: 'Ya',
                                        value: "true",
                                        onClick: () => {
                                            _updateQuery({
                                                "isActive": "true",
                                            })

                                        }
                                    }
                                ]}
                            />
                        </div>

                        {
                            _form.category == "NEWS" && (
                                <Col
                                    style={{
                                        margin: ".5rem"
                                    }}
                                >
                                    <p
                                        style={{
                                            marginBottom: "1rem"
                                        }}
                                    >
                                        Artikel
                                    </p>

                                    <Wysiwyg
                                        data={_form.tempBody}
                                        visible={props?.visible}
                                        onChange={(value) => {
                                            _updateQuery({
                                                body: value
                                            })
                                        }}
                                    />
                                </Col>
                            )
                        }


                    </Col>


                </Row>

                <div
                    style={{
                        margin: "1rem 0rem 0rem .5rem"
                    }}
                >
                    <Button
                        title={'Simpan'}
                        styles={Button.secondary}
                        onClick={_uploadImage}
                        onProcess={_isProcessing}
                    />
                </div>




            </ModalContent>

        </Modal>
    )
}