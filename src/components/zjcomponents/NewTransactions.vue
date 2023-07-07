<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue';
import { useStore } from 'src/store';
import { useQuasar } from 'quasar';
import { isHexadecimal } from 'src/utils/string-utils';
import { do_transaction, getAddressFromPrivateKey } from 'src/utils/zjchain';
import { Error } from 'src/types';

export default defineComponent({
    name:'NewTransactions',
    methods: { isHexadecimal },
    props: {
    },
    setup() {
        const $q = useQuasar();
        const store = useStore();
        const vDialog = ref(false);
        const isLogin = computed(() => !!store.state.account.selfPrivateKey);
        const selfPrivateKey = computed(() => store.state.account.selfPrivateKey);
        const selfAddress = computed(() => store.state.account.selfAccountAddress);
        const formData = reactive({
            to:'',
            amount: 0,
            gas_limit: 0,
            gas_price: 0,
            self_private_key:selfPrivateKey,
        });
        onMounted(() => {
            if (!isLogin.value || getAddressFromPrivateKey(selfPrivateKey.value) !== selfAddress.value) {
                store.commit('account/setNeedReLogin', true);
            }
        });

        function onSubmit () {
            try {

                $q.loading.show({
                    delay: 400, // ms
                });

                const status = do_transaction(formData);
                if (status) {
                    $q.notify({
                        color: 'green-4',
                        textColor: 'white',
                        icon: 'cloud_done',
                        message: 'success',
                    });
                } else {
                    throw new Error();
                }
            } catch (e) {
                const error = JSON.parse(JSON.stringify(e)) as Error;
                handleError(
                    error?.cause?.json?.error?.what || 'Unable to create a transaction',
                );
            } finally {
                $q.loading.hide();
            }
        }
        function handleError(message: string) {
            $q.notify({
                color: 'negative',
                message,
                actions: [
                    {
                        label: 'Dismiss',
                        color: 'white',
                    },
                ],
            });
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
            reLoginAndvDialog,
        };
    },
});

</script>

<template>
<q-btn
    padding="sm md"
    color="primary"
    label="New Transactions"
    @click="reLoginAndvDialog"
/>
<q-dialog
    v-model="vDialog"
    persistent
    transition-show="scale"
    transition-hide="scale"
>
    <q-card class="q-pa-lg dialog-card">

        <q-form
            @submit="onSubmit"
        >
            <div class="row justify-between items-center q-py-lg">
                <h1 class="text-h5 q-ma-none">New  Transaction</h1>
            </div>
            <div class="q-col-gutter-md">
                <div class="row  col-gutter-md">
                    <div class="col-12 ">
                        <q-input
                            v-model="formData.to"
                            outlined
                            dense
                            hide-bottom-space
                            lazy-rules
                            bg-color="white"
                            label="To Address"
                            maxlength="40"
                            :rules="[value => !!value && value.length === 40 && isHexadecimal(value)  || 'transfer to address hex code length must 40']"
                        />
                    </div>
                </div>
                <div class="row   q-col-gutter-md">
                    <div class="col-12 ">
                        <q-input
                            v-model="formData.amount"
                            outlined
                            dense
                            hide-bottom-space
                            lazy-rules
                            bg-color="white"
                            label="Amount"
                            type="number"
                            maxlength="40"
                        />
                    </div>
                </div>
                <div class="row   q-col-gutter-md" >
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
                        label="Send Transaction"
                        type="submit"
                    />
                </div>
            </q-card-actions>
        </q-form>

    </q-card>
</q-dialog>
</template>

<style scoped lang="sass">
.dialog-card
    background: #E8E2F7
    width: 700px
    max-width: 80vw
</style>
