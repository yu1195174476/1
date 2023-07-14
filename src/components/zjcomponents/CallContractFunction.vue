<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue';
import { useStore } from 'src/store';
import { copy, isHexadecimal } from 'src/utils/string-utils';
import { getAddressFromPrivateKey, handleError } from 'src/utils/zjUtils';
import { Error } from 'src/types';
import { zjApi } from 'src/api/zjApi';
import { do_create_contract } from 'src/api/zjChainApi';
import { Loading } from 'quasar';
import { useRouter } from 'vue-router';

const defaultCode ='// This is a Demo\n' +
    'pragma solidity ^0.7.5;\n' +
    'contract Storage {\n' +
    '    uint256 public storedData;\n' +
    '    function set(uint256 data) public {\n' +
    '        storedData = data;\n' +
    '    }\n' +
    '    function get() public returns (uint256) {\n' +
    '        return storedData;\n' +
    '    }\n' +
    '}\n';
export default defineComponent({
    name:'CallFunction',
    methods: { copy, isHexadecimal },
    props: {
    },
    setup() {
        const router = useRouter();
        const store = useStore();
        const vDialog = ref(false);
        const isLogin = computed(() => !!store.state.account.selfPrivateKey);
        const selfPrivateKey = computed(() => store.state.account.selfPrivateKey);
        const selfAddress = computed(() => store.state.account.selfAccountAddress);
        const selfPublicKey = computed(() => store.state.account.selfPublicKey);
        const selfShardId = computed(() => store.state.account.selfShardId);
        const formData = reactive({
            to:'',
            contract_name: '',
            contract_desc:'',
            amount: 0,
            gas_limit: 0,
            gas_price: 0,
            sorce_codes: defaultCode,
            contract_bytes:''.toString(),
            self_private_key:selfPrivateKey,
            selfAddress:selfAddress.value,
            selfPublicKey:selfPublicKey,
            local_account_shard_id:selfShardId.value,
        });
        onMounted(() => {
            if (!isLogin.value || getAddressFromPrivateKey(selfPrivateKey.value) !== selfAddress.value) {
                store.commit('account/setNeedReLogin', true);
            }
        });
        async function generatedCode() {
            try {
                let responsePromise = await zjApi.getBytescode(formData.sorce_codes);
                formData.contract_bytes = responsePromise.code;
            } catch (e) {
                handleError('Binary Code Auto Generated failed');
            }
        }

        function jump2AccountContract(accountId : string) {
            void router.push({
                path: '/account/' + accountId,
                query: {
                    tab: 'contract-detail',
                },
            });
            console.log(router.currentRoute.value);
        }

        async function onSubmit() {
            jump2AccountContract('d9ec5aff3001dece14e1f4a35a39ed506bd6274a');
            try {
                Loading.show();
                let createContractId = await do_create_contract(formData) as string;
                if (createContractId) {
                    console.log('to createContractId account as Contract');
                }
            } catch (e) {
                const error = JSON.parse(JSON.stringify(e)) as Error;
                handleError(
                    error?.cause?.json?.error?.what || 'Unable to Deploy the Contract',
                );
                Loading.hide();
                console.log(2);
                throw e;
            }
        }
        function reLoginAndvDialog() {
            if (isLogin.value) {
                vDialog.value = true;
            }
        }



        return{
            isLogin,
            vDialog,
            formData,
            onSubmit,
            generatedCode,
            reLoginAndvDialog,
            jump2AccountContract,
        };
    },
});

</script>

<template>
<q-btn
    padding="sm md"
    color="primary"
    label="Call Function"
    @click="vDialog = true"
/>
<q-dialog
    v-model="vDialog"
    persistent
    transition-show="scale"
    transition-hide="scale"
>
    <q-card class="q-pa-lg dialog-card">
        <q-form
            class=""
            @submit="onSubmit"
        >
            <div class="">
                <div class="row justify-between items-center q-py-lg">
                    <h1 class="text-h5 q-ma-none">Call Function</h1>
                </div>
                <div class="q-col-gutter-md">
                    <div class="row   q-col-gutter-md">
                        <div class=" col">
                            <q-input
                                v-model="formData.gas_limit"
                                outlined
                                dense
                                hide-bottom-space
                                lazy-rules
                                bg-color="white"
                                label="Max Gas"
                                maxlength="12"
                            />
                        </div>

                        <div class="col">
                            <q-input
                                v-model="formData.gas_price"
                                outlined
                                dense
                                hide-bottom-space
                                lazy-rules
                                bg-color="white"
                                label="Gas Price"
                                maxlength="40"
                            />
                        </div>
                    </div>
                    <div class="row   q-col-gutter-md">
                        <div class=" col">
                            <div class="q-field">
                                <q-input
                                    v-model="formData.sorce_codes"
                                    outlined
                                    dense
                                    hide-bottom-space
                                    lazy-rules
                                    debounce="1000"
                                    bg-color="blue-grey-2"
                                    type="textarea"
                                    rows="15"
                                    label="Paste call function binary codes."
                                />
                                <q-btn
                                    flat
                                    round
                                    color="black"
                                    icon="content_copy"
                                    size="sm"
                                    class="copy-button"
                                    @click="copy(formData.sorce_codes)"
                                />
                            </div>

                        </div>
                    </div>
                </div>

                <q-card-actions align="right" class="text-primary q-pt-lg">
                    <div>
                        <q-btn
                            v-close-popup
                            outline
                            class="q-mr-sm"
                            padding="sm md"
                            color="white"
                            text-color="primary"
                            label="Cancel"
                        />
                        <q-btn
                            unelevated
                            padding="sm md"
                            color="primary"
                            label="Call Function"
                            type="submit"
                        />
                    </div>
                </q-card-actions>
            </div>
        </q-form>

    </q-card>
</q-dialog>
</template>

<style scoped lang="sass">
.dialog-card
    background: #E8E2F7
    width: 700px
    max-width: 80vw
    border-radius: 10px
.from
    height: 500px

.q-field
    position: relative

.copy-button
    position: absolute
    top: 0
    right: 28px
</style>
