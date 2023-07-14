<script  lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import AccountKeyValueTable from 'components/zjcomponents/AccountKeyValueTable.vue';
import { useRoute, useRouter } from 'vue-router';
import ContractCodemirror from 'components/zjcomponents/ContractCodemirror.vue';
import { copy } from 'src/utils/string-utils';
import CallFunction from 'components/zjcomponents/CallContractFunction.vue';

export default defineComponent({
    name:'ContractDetail',
    methods: { copy },
    components: { CallFunction,  ContractCodemirror: ContractCodemirror,  AccountKeyValueTable },
    setup() {
        const route = useRoute();
        const router = useRouter();
        const contract_tab = ref<string>((route.query['contract_tab'] as string) || 'code');

        let account = computed(() => (route.params.account as string) || '');

        watch(contract_tab,  () => {
            const element = document.getElementById('contract_tab_target');
            window.scrollTo(0, element.offsetHeight + 400);
        });

        return {
            account,
            contract_tab,
        };

    },

});
</script>

<template>
<q-card>
    <q-tabs
        v-model="contract_tab"
        class="text-grey-7 tab-text"
        dense
        active-bg-color="primary"
        indicator-color="primary"
        active-color="white"
        active-class="contract-q-tabs-active"
        align="left"
        no-caps
    >
        <q-tab name="code" label="Code"/>
        <q-tab name="contract_data" label="Data"/>
        <q-tab name="contract-detail" label="Contract Detail"/>
    </q-tabs>
</q-card>
<div id="contract_tab_target"></div>
<q-tab-panels v-model="contract_tab" class="q-mt-md col-12">
    <q-tab-panel class="bg-grey-3"  name="code">
        <q-card class="my-card row q-mb-md">
            <q-card bordered class="row col-12 q-pa-xs  d-flex align-center text-h5">
                Contract Detail
            </q-card>
            <q-card-section class="row col-auto">
                <q-list dense>
                    <q-item>
                        <q-item-section>ContractName: {{ 123 }}</q-item-section>
                    </q-item>
                    <q-item>
                        <q-item-section>Address: {{ 123 }}</q-item-section>
                    </q-item>
                    <q-item>
                        <q-item-section>Creator: {{ 123 }}</q-item-section>
                    </q-item>
                    <q-item>
                        <q-item-section>Balance: {{ 123 }}</q-item-section>
                    </q-item>
                    <q-item>
                        <q-item-section>Description: {{ 123 }}</q-item-section>
                    </q-item>
                </q-list>
            </q-card-section>
        </q-card>
        <div class="row">
            <q-card bordered class="col">
                <q-card bordered class="row col-12 q-pa-xs q-mb-md text-h5">
                    <div class="col" >
                        <div>Solidity Source Code
                            <q-btn
                                flat
                                round
                                color="black"
                                icon="content_copy"
                                size="sm"
                                @click="copy('')"
                            />
                        </div>

                    </div>
                    <div class="col-auto q-pr-sm">
                    </div>
                </q-card>

                <ContractCodemirror/>
            </q-card>
            <q-card bordered class="col q-ml-md">
                <q-card bordered class="row col-12 q-pa-xs q-mb-md text-h5">
                    <div class="col" >
                        <div>Binary Code
                            <q-btn
                                flat
                                round
                                color="black"
                                icon="content_copy"
                                size="sm"
                                @click="copy('')"
                            />
                        </div>

                    </div>
                    <div class="col-auto q-pr-sm">
                        <CallFunction/>
                    </div>
                </q-card>
                <ContractCodemirror/>
            </q-card>
        </div>
    </q-tab-panel>
    <q-tab-panel name="contract_data">
        <AccountKeyValueTable title="Account Data" :account="account"/>
    </q-tab-panel>
</q-tab-panels>
</template>

<style scoped lang="sass">
.d-flex
    display: flex
.justify-center
    justify-content: center
.align-center
    align-items: center
.tab-text
    font-size: 40px !important
.account-card
    width: 550px
    border-radius: .5rem
    margin-top: 1rem
    margin-left: auto
    margin-right: auto
    margin-bottom: 2rem
    box-shadow: none

.tabs
    color: white
.my-card
    border-radius: 10px


</style>
