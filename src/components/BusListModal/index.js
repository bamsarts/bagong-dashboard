import AppContext from '../../context/app'
import Modal, { ModalContent } from '../Modal'
import { useEffect, useState, useContext } from 'react'
import Input from '../Input'
import { postJSON } from '../../api/utils'
import Button from '../Button'
import styles from './BusListModal.module.scss'
import { popAlert } from '../Main'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    refresh: () => {}
}

BusListModal.defaultProps = defaultProps

export default function BusListModal(props = defaultProps) {
    const appContext = useContext(AppContext)

    const [_categoryRanges, _setCategoryRanges] = useState([])
    const [_trajectTypeRanges, _setTrajectTypeRanges] = useState([])
    const [_poolRanges, _setPoolRanges] = useState([])
    const [_poolInapRanges, _setPoolInapRanges] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)

    const CONFIG_PARAM = {
        code: '',
        isActive: true,
        name: '',
        busCategoryId: '',
        companyId: appContext.authData.companyId,
        trajectTypeId: '',
        registrationPlate: '',
        poolId: '',
        poolInapId: '',
        totalSeat: '',
        category: {},
        trajectType: {},
        pool: {},
        poolInap: {},
        id: ''
    }

    const [_form, _setForm] = useState(CONFIG_PARAM)

    useEffect(() => {
        _getCategory()
        _getTypeTraject()
        _getPool()
    }, [])

    useEffect(() => {
        let category = _findData(_categoryRanges, 'category', props.data.busCategoryId)
        let trajectType = _findData(_trajectTypeRanges, 'traject', props.data.trajectTypeId)
        let pool = _findData(_poolRanges, 'pool', props.data.poolId)
        let poolInap = _findData(_poolInapRanges, 'poolInap', props.data.poolInapId)

        _updateQuery({
            ...props.data,
            category: category,
            trajectType: trajectType,
            pool: pool,
            poolInap: poolInap,
            totalSeat: category.totalSeat
        })
    }, [props.data, _categoryRanges, _trajectTypeRanges, _poolRanges, _poolInapRanges])

    function _findData(data, type, objectSearch) {
        let result = {}
        data.forEach(val => {
            if (val.value == objectSearch) {
                result = val
            }
        })
        return result
    }

    function _updateQuery(data = {}) {
        _setForm(old => ({
            ...old,
            ...data
        }))
    }

    function _clearForm() {
        _setForm(CONFIG_PARAM)
    }

    async function _getCategory() {
        const params = { startFrom: 0, length: 60 }

        try {
            const category = await postJSON(
                `/masterData/bus/kategori/list`,
                params,
                appContext.authData.token
            )

            let categoryRange = []
            category.data.forEach(val => {
                categoryRange.push({
                    title: `${val.name} (${val.code})`,
                    value: val.id,
                    totalSeat: val.totalSeat
                })
            })

            _setCategoryRanges(categoryRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getTypeTraject() {
        const params = {
            startFrom: 0,
            length: 60,
            companyId: appContext.authData.companyId
        }

        try {
            const trajectType = await postJSON(
                `/masterData/trayekType/list`,
                params,
                appContext.authData.token
            )

            let trajectTypeRange = []
            trajectType.data.forEach(val => {
                trajectTypeRange.push({
                    title: val.name,
                    value: val.id
                })
            })

            _setTrajectTypeRanges(trajectTypeRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getPool() {
        const params = {
            startFrom: 0,
            length: 100,
        }

        try {
            const pool = await postJSON(
                `/masterData/branch/pool/list`,
                params,
                appContext.authData.token
            )

            let poolRange = []
            pool.data.forEach(val => {
                poolRange.push({
                    title: val.name,
                    value: val.id
                })
            })

            _setPoolRanges(poolRange)
            _setPoolInapRanges(poolRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _submitData() {
        _setIsProcessing(true)

        try {
            let typeUrl = 'add'
            let query = { ..._form }

            delete query.category
            delete query.trajectType
            delete query.pool
            delete query.poolInap
            delete query.totalSeat

            delete query.busCategoryCode
            delete query.busCategoryTotalSeat
            delete query.busCategoryType
            delete query.poolName
            delete query.poolInapName

            query.id = Number(query.id)
            query.busCategoryId = Number(query.busCategoryId)
            query.companyId = Number(query.companyId)
            query.trajectTypeId = Number(query.trajectTypeId)
            query.poolId = Number(query.poolId)
            query.poolInapId = Number(query.poolInapId)

            if (props.data.id) {
                typeUrl = 'update'
            } else {
                delete query.id
            }

            const result = await postJSON(
                `/masterData/bus/${typeUrl}`,
                query,
                appContext.authData.token
            )

            props.refresh()
            if (result) props.closeModal()
            _clearForm()

            popAlert({ message: 'Berhasil disimpan', type: 'success' })
        } catch (e) {
            popAlert({
                message:
                    typeof e?.message === 'string'
                        ? e.message
                        : 'Gagal Menyimpan Data'
            })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Modal visible={props.visible} centeredContent>
            <ModalContent
                header={{
                    title: props.data.id ? 'Ubah Bus' : 'Tambah Bus',
                    closeModal: () => {
                        props.closeModal()
                        _clearForm()
                    }
                }}
            >
                <Input
                    withMargin
                    title="Kode Bus"
                    value={_form.code}
                    onChange={value => _updateQuery({ code: value })}
                />

                <Input
                    withMargin
                    title="Nama Bus"
                    value={_form.name}
                    onChange={value => _updateQuery({ name: value })}
                />

                <Input
                    withMargin
                    title="Kategori"
                    value={_form.category?.title}
                    suggestions={_categoryRanges}
                    suggestionField="title"
                    onSuggestionSelect={data =>
                        _updateQuery({
                            busCategoryId: data.value,
                            category: data,
                            totalSeat: data.totalSeat
                        })
                    }
                />

                <Input
                    withMargin
                    disabled
                    title="Jumlah Kursi"
                    value={_form.totalSeat || 0}
                />

                <Input
                    withMargin
                    title="Jenis Trayek"
                    value={_form.trajectType?.title}
                    suggestions={_trajectTypeRanges}
                    suggestionField="title"
                    onSuggestionSelect={data =>
                        _updateQuery({
                            trajectTypeId: data.value,
                            trajectType: data
                        })
                    }
                />

                <Input
                    withMargin
                    title="Pool"
                    value={_form.pool?.title}
                    suggestions={_poolRanges}
                    suggestionField="title"
                    onSuggestionSelect={data =>
                        _updateQuery({
                            poolId: data.value,
                            pool: data
                        })
                    }
                />

                <Input
                    withMargin
                    title="Pool Inap"
                    value={_form.poolInap?.title}
                    suggestions={_poolInapRanges}
                    suggestionField="title"
                    onSuggestionSelect={data =>
                        _updateQuery({
                            poolInapId: data.value,
                            poolInap: data
                        })
                    }
                />

                <Input
                    withMargin
                    title="Plat Nomor"
                    value={_form.registrationPlate}
                    onChange={value =>
                        _updateQuery({ registrationPlate: value })
                    }
                />

                <div className={styles.buttonContainer}>
                    <Button
                        title="Simpan"
                        styles={Button.secondary}
                        onClick={_submitData}
                        onProcess={_isProcessing}
                    />
                </div>
            </ModalContent>
        </Modal>
    )
}
