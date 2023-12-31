<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import { formatDate } from 'src/utils/string-utils';
import TextFormat from 'components/transaction/TextFormat.vue';
import { Account } from 'src/types/zj_tpyes/Account';
import NewTransactions from 'components/zjcomponents/NewTransactions.vue';
import { useStore } from 'src/store';

export default defineComponent({
    name: 'AccountCard',
    components: { NewTransactions, TextFormat },
    props: {
        accountData: {
            type: Object as PropType<Account>,
            required: false,
            default: null,
        },
    },
    setup(props) {
        const q = useQuasar();
        const store = useStore();
        const account_id = computed(() => accountData.value?.id || '');
        const vNewTransaction =  computed(() => store.state.account.selfAccountAddress === account_id.value);


        const accountData = computed(() => props.accountData);

        function copy(value: string) {
            copyToClipboard(value)
                .then((): void => {
                    q.notify({
                        color: 'green-4',
                        textColor: 'white',
                        message: 'Copied to clipboard',
                        timeout: 1000,
                    });
                })
                .catch(() => {
                    q.notify({
                        color: 'red-8',
                        textColor: 'white',
                        message: 'Could not copy',
                        timeout: 1000,
                    });
                });
        }

        const propertyOrder: Array<string> = [
            'shard_id',
            'pool_index',
            'balance',
        ];
        return {
            account_id,
            vNewTransaction,
            formatDate,
            copy,
            propertyOrder,
        };
    },
});
</script>

<template>

<div class="row full-width justify-center">
    <div class="col-xs-12 col-md-8 col-lg-6">
        <q-card class="info-card container-max-width" flat>
            <div class="q-pa-md-md q-pa-sm-sm q-pa-xs-xs q-pa-xl-lg">
                <q-card-section class="q-pl-md">
                    <div class="row q-col-gutter-sm justify-between">
                        <div class="col-auto text-h4 text-bold">Account</div>
                        <div v-if="vNewTransaction"><NewTransactions/></div>
                    </div>
                </q-card-section>
                <q-card-section class="q-pt-none">
                    <div class="row items-center">
                        <div class="col-11 text-bold ellipsis">{{ account_id }}</div>
                        <div class="col-1">
                            <q-btn
                                class="float-right"
                                flat
                                round
                                color="black"
                                icon="content_copy"
                                size="sm"
                                @click="copy(account_id.toString())"
                            />
                        </div>
                    </div>
                </q-card-section>
                <q-card-section>
                    <div class="text-grey-7">SUMMARY</div>
                </q-card-section>
                <div v-for="property in propertyOrder" :key="property">
                    <q-separator class="card-separator" inset="inset"/>
                    <q-card-section>
                        <div class="row">
                            <div class="col-xs-12 col-sm-6">
                                <div class="text-body1 text-weight-medium text-uppercase">{{
                                    property.toUpperCase()
                                }}
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-6 text-right text-bold">
                                <TextFormat :text="accountData[property].toString()"/>
                            </div>
                        </div>
                    </q-card-section>
                </div>
            </div>
        </q-card>
    </div>
</div>

</template>

<style lang="sass"></style>
