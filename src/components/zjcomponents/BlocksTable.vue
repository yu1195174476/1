<script lang="ts">
import {
    PaginationSettings,
    Token,
} from 'src/types';
import {
    computed,
    defineComponent,
    onBeforeUnmount,
    onMounted,
    PropType,
    ref,
    toRefs,
    watch,
} from 'vue';
import { api } from 'src/api';
import { zjApi } from 'src/api/zjApi';
import { useRoute, useRouter } from 'vue-router';
import { QBtnDropdown, QPopupProxy, QTable } from 'quasar';
import { Chain } from 'src/types/Chain';
import { getChain } from 'src/config/ConfigManager';
import { Block } from 'src/types/zj_tpyes/Block';
import AccountFormat from 'components/transaction/AccountFormat.vue';
import DateField from 'components/DateField.vue';
import AccountSearch from 'components/AccountSearch.vue';
import TokenSearch from 'components/TokenSearch.vue';

const chain: Chain = getChain();

const TWO_SECONDS = 2000;

export default defineComponent({
    name: 'BlocksTable',
    components: {
        TokenSearch,
        AccountSearch,
        DateField,
        AccountFormat,

    },
    props: {
        account: {
            type: String || null,
            required: false,
            default: null,
        },
        blocks: {
            type: Object as PropType<Block[]>,
            required: false,
            default: null,
        },
        showTransferLabel: {
            // show/hide send/receive label for transfers
            type: Boolean,
            default: false,
        },
        toggleEnabled: {
            type: Boolean,
            default: true,
        },
        filtersEnabled: {
            type: Boolean,
            default: false,
        },
        showPaginationExtras: {
            // show/hide pagination "last" button and total row count
            type: Boolean,
            default: false,
        },
    },
    setup(props) {
        const route = useRoute();
        const router = useRouter();
        const pagination = computed(
            () => (route.query['page'] as string) || '1,10',
        );
        const pageSizeOptions = [10, 20, 50, 100, 200];
        const {
            blocks,
            account,
        } = toRefs(props);
        const columns = [
            {
                name: 'block',
                required: true,
                label: 'BLOCK #',
                align: 'left',
                field: 'hash',
                sortable: true,
            },


            {
                name: 'timestamp',
                required: true,
                align: 'left',
                label: 'TIMESTAMP',
                field: 'timestamp',
                sortable: true,
            },
            {
                name: 'pool_index',
                required: true,
                label: 'POOL',
                align: 'left',
                field: 'pool_index',
                sortable: true,
            },
            {
                name: 'height',
                required: true,
                label: 'HEIGHT',
                align: 'left',
                field: 'height',
                sortable: true,
            },

            {
                name: 'vss',
                required: true,
                label: 'VSS',
                align: 'left',
                field: 'vss',
                sortable: true,
            },
            {
                name: 'tx_size',
                required: true,
                align: 'left',
                label: 'Transactions',
                field: 'tx_size',
                sortable: true,
            },
            {
                name: 'elect_height',
                required: true,
                align: 'left',
                label: 'EH',
                field: 'elect_height',
                sortable: true,
            },
            {
                name: 'timeblock_height',
                required: true,
                align: 'left',
                label: 'TH',
                field: 'timeblock_height',
                sortable: true,
            },
        ];
        const rows = ref<Block[]>([]);
        const totalRows = ref<number>(0);
        const filteredRows = ref<Block[]>([]);
        const loading = ref<boolean>(false);
        const showPagesSizes = ref<boolean>(false);
        const switchPageSelector = () => {
            showPagesSizes.value = !showPagesSizes.value;
        };
        const changePageSize = async (size: number) => {
            paginationSettings.value.rowsPerPage = size;
            paginationSettings.value.page = 1;
            await onPaginationChange({ pagination: paginationSettings.value });
        };
        const changePagination = async (page: number, size: number) => {
            paginationSettings.value.page = page;
            paginationSettings.value.rowsPerPage = size;
            await onPaginationChange({ pagination: paginationSettings.value });
        };
        const paginationSettings = ref<PaginationSettings>({
            sortBy: 'timestamp',
            descending: true,
            page: 1,
            rowsPerPage: pageSizeOptions[0],
            rowsNumber: 10000,
        });

        const enableLives = ref<boolean>(true);
        const currentFirstAction = ref<number>(0);

        // actions filter
        const auxModel = ref('');
        const actionsModel = ref('');
        const actionsDisplay = computed(() => {
            if (actionsModel.value) {
                const list = actionsModel.value.split(',');
                return list.length > 1 ? list[0] + '...' : list[0];
            }
            return '';
        });

        // accounts filter
        const showAccountFilter = ref<boolean>(chain.getFiltersSupported('notified'));
        const accountsModel = ref('');
        const accountsDisplay = computed(() => {
            if (accountsModel.value) {
                const list = accountsModel.value.split(',');
                return list.length > 1 ? list[0] + '...' : list[0];
            }
            return '';
        });

        // token filter
        const showTokenFilter = ref(false);
        const tokenModel = ref(null as Token | null);
        const tokenDisplay = computed(() => {
            if (tokenModel.value) {
                return tokenModel.value?.symbol ?? '';
            }
            return '';
        });
        void api.getTokens().then((tokens) => {
            if (tokens.length > 0) {
                showTokenFilter.value = true;
            }
        });

        // date filter
        const now = new Date().toISOString();
        const fromDateModel = ref('');
        const toDateModel = ref<string>(now);
        const dateDisplay = computed(() => {
            try {
                if (fromDateModel.value !== '' || toDateModel.value !== now) {
                    if (fromDateModel.value === '') {
                        return 'Until ' + toDateModel.value.split('T')[0];
                    } else if (toDateModel.value === now) {
                        return 'Since ' + fromDateModel.value.split('T')[0];
                    } else {
                        return (
                            fromDateModel.value.split('T')[0] +
                            ' - ' +
                            toDateModel.value.split('T')[0]
                        );
                    }
                }
            } catch (e) {
                console.error(e);
            }
            return '';
        });

        const interval = ref<number>(null);
        const showAge = ref<boolean>(localStorage.getItem('showAge') === 'true');


        const tableTitle = computed(() =>
            'Latest Blocks',
        );

        const lastPage = computed(() => {
            const rowsPerPage = paginationSettings.value.rowsPerPage;
            const rowsNumber = totalRows.value;
            return Math.ceil(rowsNumber / rowsPerPage);
        });

        const hasBlocks = computed(() => blocks.value !== null);
        const clearFilters = (): void => {
            accountsModel.value = '';
            actionsModel.value = '';
            tokenModel.value = null;
            fromDateModel.value = '';
            toDateModel.value = now;
        };
        const filter = computed(() => (
            accountsDisplay.value +
            actionsDisplay.value +
            dateDisplay.value +
            tokenDisplay.value
        ));

        const filterRows = () => {
            filteredRows.value = rows.value;
        };

        const loadTableData = async (): Promise<void> => {
            let tableData: Block[];
            const page = paginationSettings.value.page;
            let limit = paginationSettings.value.rowsPerPage;
            const response = await zjApi.getBlocks({
                page,
                limit,
            });
            tableData = response.data.dataList;
            totalRows.value = response.data.total;

            if (tableData) {
                rows.value = tableData;
            }
            void filterRows();
        };

        const onRequest = async (props: {
            pagination: {
                page: number;
                rowsPerPage: number;
                sortBy: string;
                descending: boolean;
            };
        }) => {
            loading.value = true;
            const {
                page,
                rowsPerPage,
                sortBy,
                descending,
            } = props.pagination;
            paginationSettings.value.page = page;
            paginationSettings.value.rowsPerPage = rowsPerPage;
            paginationSettings.value.sortBy = sortBy;
            paginationSettings.value.descending = descending;
            await loadTableData();
            loading.value = false;
        };

        const onPaginationChange = async (props: {
            pagination: {
                page: number;
                rowsPerPage: number;
                sortBy: string;
                descending: boolean;
            };
        }) => {
            const {
                page,
                rowsPerPage,
            } = props.pagination;

            // we need to change the URL to keep the pagination state by changing the route.query.page
            // with a string like 'page,rowsPerPage'
            await router.push({
                // taking care to preserve the current #hash anchor and the current query parameters
                hash: window.location.hash,
                query: {
                    ...route.query,
                    page: `${page},${rowsPerPage}`,
                },
            });
        };

        const applyPagination = async (
            page: string | number,
            size: string | number,
        ) => {
            if (page) {
                paginationSettings.value.page = Number(page);
            }
            if (size) {
                paginationSettings.value.rowsPerPage = Number(size);
            }
            await onRequest({
                pagination: paginationSettings.value,
            });
        };

        const checkIsMultiLine = (data: string): boolean => data.length > 0 && data.split('\n').length > 1;

        const setLiveInterval = () => {
            currentFirstAction.value = 0;
            clearInterval(interval.value);
            interval.value = window.setInterval(() => {
                void loadTableData();
            }, TWO_SECONDS);
        };

        const clearLiveInterval = () => {
            clearInterval(interval.value);
        };

        onBeforeUnmount(() => {
            clearLiveInterval();
        });

        watch([account, blocks], async () => {
            void loadTableData();
            await changePagination(1, paginationSettings.value.rowsPerPage);
        });

        watch(filter, async () => {
            if (paginationSettings.value.page !== 1) {
                await changePagination(1, paginationSettings.value.rowsPerPage);
            } else {
                enableLives.value = false;
                await loadTableData();
            }
        });

        watch(showAge, (val) => {
            localStorage.setItem('showAge', val ? 'true' : 'false');
        });

        const updateLiveTransactionState = async () => {
            if (enableLives.value) {
                clearFilters();
                if (paginationSettings.value.page !== 1) {
                    await changePagination(1, paginationSettings.value.rowsPerPage);
                }
                setLiveInterval();
            } else {
                clearLiveInterval();
            }
        };

        watch(enableLives, () => {
            void updateLiveTransactionState();
        });

        onMounted(() => {
            void updateLiveTransactionState();
        });

        // create a watch for pagination and make sure it is called immediately
        watch(
            () => pagination.value,
            async () => {
                let pageValue = pagination.value;
                let page = 1;
                let size = pageSizeOptions[0];

                // we also allow to pass a single number as the page number
                if (typeof pageValue === 'number') {
                    page = pageValue;
                } else if (typeof pageValue === 'string') {
                    // we also allow to pass a string of two numbers: 'page,rowsPerPage'
                    const [p, s] = pageValue.split(',');
                    page = Number(p);
                    size = Number(s);
                }
                // automatically disable live transactions on navigation from front page
                if (page !== 1) {
                    enableLives.value = false;
                }
                await applyPagination(page, size);
            },
            { immediate: true },
        );

        const toggleDropdown = (ref: unknown) => {
            const drop: QBtnDropdown = ref as QBtnDropdown;
            drop.toggle();
        };

        const hidePopup = (ref: unknown) => {
            const drop: QPopupProxy = ref as QPopupProxy;
            drop.hide();
        };

        const moveTablePage = (ref: unknown, dir: 'next' | 'prev' | 'first' | 'last') => {
            const table: QTable = ref as QTable;
            if (dir === 'next') {
                table.nextPage();
            } else if (dir === 'prev') {
                table.prevPage();
            } else if (dir === 'first') {
                table.firstPage();
            } else if (dir === 'last') {
                void changePagination(lastPage.value, paginationSettings.value.rowsPerPage);
            }
        };

        return {
            columns,
            rows,
            filteredRows,
            loading,
            showPagesSizes,
            paginationSettings,
            fromDateModel,
            toDateModel,
            dateDisplay,
            actionsDisplay,
            actionsModel,
            auxModel,
            accountsDisplay,
            accountsModel,
            showAccountFilter,
            tokenDisplay,
            tokenModel,
            showTokenFilter,
            interval,
            showAge,
            tableTitle,
            lastPage,
            hasTransactions: hasBlocks,
            filter,
            onRequest,
            loadTableData,
            checkIsMultiLine,
            filterRows,
            totalRows,
            pageSizeOptions,
            changePageSize,
            switchPageSelector,
            applyPagination,
            changePagination,
            onPaginationChange,
            clearFilters,
            enableLives,
            toggleDropdown,
            hidePopup,
            moveTablePage,
        };
    },
});
</script>

<template>

<div class="row col-12 q-mt-xs justify-center text-left trx-table container-max-width">
    <div class="row trx-table--main-container">
        <div class="row col-12 q-mt-lg">
            <!-- Left column-->
            <div class="col-auto q-mr-xl justify-start trx-table--topleft-col">
                <div class="row flex-grow-1">
                    <div class="col">
                        <!-- -- Title ---->
                        <p class="trx-table--title">{{ tableTitle }}</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <q-toggle
                            v-model="showAge"
                            left-label
                            label="Show timestamp as relative"
                        />
                    </div>
                </div>
                <div v-if="toggleEnabled" class="row">
                    <div class="col">
                        <q-toggle
                            v-model="enableLives"
                            left-label
                            label="Live transactions"
                            :disable="paginationSettings.page !== 1"
                        />
                    </div>
                </div>
            </div>
            <!-- Right column-->
            <div v-if="filtersEnabled" class="col trx-table--topright-col">
                <div class="row justify-end q-mb-xl">
                    <!-- -- Filters    ---->
                    <div class="col-auto row flex trx-table--filter-buttons">
                        <q-btn
                            v-if="filter !== ''"
                            dense
                            flat
                            round
                            icon="close"
                            color="primary"
                            @click="clearFilters"
                        ><span class="q-pr-sm">clear filters</span></q-btn>
                        <q-btn-dropdown
                            v-if="showAccountFilter"
                            ref="accounts_dropdown"
                            class="q-ml-xs q-mr-xs button-primary q-btn--no-text-transform"
                            no-caps
                            :color="accountsDisplay === '' ? 'primary': 'secondary'"
                            :label="accountsDisplay === '' ? 'Accounts' : accountsDisplay"
                            @click="accountsModel = ''"
                        >
                            <div class="q-pa-md dropdown-filter">
                                <div class="row">
                                    <AccountSearch
                                        v-model="accountsModel"
                                        @update:model-value="toggleDropdown($refs.accounts_dropdown)"
                                    />
                                </div>
                            </div>
                        </q-btn-dropdown>
                        <q-btn-dropdown
                            ref="actions_dropdown"
                            class="q-ml-xs q-mr-xs button-primary q-btn--no-text-transform"
                            :color="actionsDisplay === '' ? 'primary': 'secondary'"
                            :label="actionsDisplay === '' ? 'Actions' : actionsDisplay"
                        >
                            <div class="q-pa-md dropdown-filter">
                                <div class="row">
                                    <q-input
                                        v-model="auxModel"
                                        filled
                                        dense
                                        label="actions"
                                        placeholder="transfer, sellrex, etc."
                                        @blur="actionsModel = auxModel; toggleDropdown($refs.actions_dropdown)"
                                        @keyup.enter="actionsModel = auxModel; toggleDropdown($refs.actions_dropdown)"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon class="cursor-pointer" name="search"/>
                                        </template>
                                        <template v-slot:append>
                                            <q-btn
                                                size="sm"
                                                color="primary"
                                                @click="actionsModel = auxModel; toggleDropdown($refs.actions_dropdown)"
                                            >
                                                OK
                                            </q-btn>
                                        </template>
                                    </q-input>
                                </div>
                            </div>
                        </q-btn-dropdown>
                        <q-btn-dropdown
                            class="q-ml-xs q-mr-xs button-primary q-btn--no-text-transform"
                            :color="dateDisplay === '' ? 'primary': 'secondary'"
                            :label="dateDisplay === '' ? 'Date' : dateDisplay"
                        >
                            <div class="q-pa-md dropdown-filter">
                                <div class="row">
                                    <q-input
                                        v-model="fromDateModel"
                                        filled
                                        dense
                                        label="From"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon class="cursor-pointer" name="event">
                                                <q-popup-proxy
                                                    cover=""
                                                    transition-show="scale"
                                                    transition-hide="scale"
                                                >
                                                    <q-date v-model="fromDateModel" mask="YYYY-MM-DD HH:mm">
                                                        <div class="row items-center justify-end">
                                                            <q-btn
                                                                v-close-popup
                                                                label="Close"
                                                                color="primary"
                                                                flat
                                                            />
                                                        </div>
                                                    </q-date>
                                                </q-popup-proxy>
                                            </q-icon>
                                        </template>
                                        <template v-slot:append>
                                            <q-icon class="cursor-pointer" name="access_time">
                                                <q-popup-proxy
                                                    cover="cover"
                                                    transition-show="scale"
                                                    transition-hide="scale"
                                                >
                                                    <q-time
                                                        v-model="fromDateModel"
                                                        mask="YYYY-MM-DD HH:mm"
                                                        format24h
                                                    >
                                                        <div class="row items-center justify-end">
                                                            <q-btn
                                                                v-close-popup
                                                                label="Close"
                                                                color="primary"
                                                                flat
                                                            />
                                                        </div>
                                                    </q-time>
                                                </q-popup-proxy>
                                            </q-icon>
                                        </template>
                                    </q-input>
                                </div>
                                <div class="row justify-center full-width q-py-xs">
                                    <q-icon name="arrow_downward"/>
                                </div>
                                <div class="row">
                                    <q-input
                                        v-model="toDateModel"
                                        filled
                                        dense
                                        label="To"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon class="cursor-pointer" name="event">
                                                <q-popup-proxy
                                                    cover="cover"
                                                    transition-show="scale"
                                                    transition-hide="scale"
                                                >
                                                    <q-date v-model="toDateModel" mask="YYYY-MM-DD HH:mm">
                                                        <div class="row items-center justify-end">
                                                            <q-btn
                                                                v-close-popup
                                                                label="Close"
                                                                color="primary"
                                                                flat
                                                            />
                                                        </div>
                                                    </q-date>
                                                </q-popup-proxy>
                                            </q-icon>
                                        </template>
                                        <template v-slot:append>
                                            <q-icon class="cursor-pointer" name="access_time">
                                                <q-popup-proxy
                                                    cover=""
                                                    transition-show="scale"
                                                    transition-hide="scale"
                                                >
                                                    <q-time v-model="toDateModel" mask="YYYY-MM-DD HH:mm" format24h>
                                                        <div class="row items-center justify-end">
                                                            <q-btn
                                                                v-close-popup
                                                                label="Close"
                                                                color="primary"
                                                                flat
                                                            />
                                                        </div>
                                                    </q-time>
                                                </q-popup-proxy>
                                            </q-icon>
                                        </template>
                                    </q-input>
                                </div>
                            </div>
                        </q-btn-dropdown>
                        <q-btn-dropdown
                            v-if="showTokenFilter"
                            ref="token_dropdown"
                            class="q-ml-xs q-mr-xs button-primary q-btn--no-text-transform"
                            :color="!tokenDisplay ? 'primary': 'secondary'"
                            :label="!tokenDisplay ? 'Token' : tokenDisplay"
                        >
                            <div class="q-pa-md dropdown-filter">
                                <div class="row">
                                    <TokenSearch
                                        v-model="tokenModel"
                                        @update:model-value="toggleDropdown($refs.token_dropdown)"
                                    />
                                </div>
                            </div>
                        </q-btn-dropdown>
                    </div>
                </div>
                <div v-if="showPaginationExtras" class="row justify-end">
                    Viewing
                    {{ paginationSettings.rowsPerPage > totalRows ? totalRows : paginationSettings.rowsPerPage }}
                    of {{ totalRows === 10000 ? ' over ' : '' }} {{ totalRows.toLocaleString() }} total transactions
                </div>
            </div>
        </div>
        <q-separator class="row col-12 q-mt-md separator"/>
        <div class="row col-12 table-container">
            <q-table
                ref="main_table"
                v-model:pagination="paginationSettings"
                class="q-mt-md row block-table--fixed-layout"
                flat
                table-header-class="table-header"
                hide-pagination
                :rows="filteredRows"
                :columns="columns"
                :row-key="row => row.name"
                :bordered="false"
                :square="true"
                :loading="loading"
                :rows-per-page-options="pageSizeOptions"
                :dense="$q.screen.width < 1024"
                @request="onPaginationChange"
            >
                <template v-slot:header="props">
                    <q-tr :props="props">
                        <q-th v-for="col in props.cols" :key="col.name" :props="props">{{ col.label }}</q-th>
                    </q-tr>
                </template>
                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td>
                            <AccountFormat :account="props.row.hash" type="block"/>
                        </q-td>
                        <q-td>
                            <DateField :timestamp="props.row.timestamp" :showAge="showAge"/>
                        </q-td>
                        <template v-for="col in props.cols">
                            <q-td
                                v-if="col.name != 'block' && col.name != 'timestamp'"
                                :key="col.name"
                                :props="props"
                            >{{ props.row[col.name] }}
                            </q-td>
                        </template>

                    </q-tr>
                </template>
            </q-table>
        </div>
        <div class="row col-12 items-center justify-end q-mt-md q-mb-sm">
            <!-- records per page selector-->
            <div class="col-auto">
                <small>Rows per page: &nbsp; {{ paginationSettings.rowsPerPage }}</small>
                <!-- dropdown button to select number of rows per page-->
                <q-icon
                    :name="showPagesSizes ? 'expand_more' : 'expand_less'"
                    size="sm"
                    @click="switchPageSelector"
                >
                    <q-popup-proxy ref="page_size_selector" transition-show="scale" transition-hide="scale">
                        <q-list>
                            <q-item v-for="size in pageSizeOptions" :key="size" class="cursor-pointer">
                                <q-item-section @click="changePageSize(size); hidePopup($refs.page_size_selector)">
                                    {{ size }}
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-popup-proxy>
                </q-icon>
            </div>
            <q-space/>
            <div class="col-auto">
                <q-btn
                    size="sm"
                    color="primary"
                    outline
                    :disable="paginationSettings.page === 1"
                    @click="moveTablePage($refs.main_table, 'first')"
                >
                    First
                </q-btn>

                <q-btn
                    size="sm"
                    color="primary"
                    outline
                    class="q-mx-sm"
                    :disable="paginationSettings.page === 1"
                    @click="moveTablePage($refs.main_table, 'prev')"
                >
                    <q-icon name="chevron_left" size="xs"/>
                </q-btn>

                <small>
                    Page {{ paginationSettings.page }}
                    {{
                        (showPaginationExtras && enableLives === false) ? (lastPage === 0 ? ` of 1` : ` of ${lastPage}`) : ''
                    }}
                </small>

                <q-btn
                    size="sm"
                    color="primary"
                    outline
                    class="q-mx-sm"
                    :disable="paginationSettings.page === lastPage || totalRows < paginationSettings.rowsPerPage"
                    @click="moveTablePage($refs.main_table, 'next')"
                >
                    <q-icon name="chevron_right" size="xs"/>
                </q-btn>

                <q-btn
                    v-if="showPaginationExtras && enableLives === false"
                    size="sm"
                    color="primary"
                    outline
                    :disable="paginationSettings.page === lastPage || lastPage === 0"
                    @click="moveTablePage($refs.main_table, 'last')"
                >
                    Last
                </q-btn>

            </div>
        </div>
    </div>
</div>

</template>

<style lang="sass">
$medium: 920px

.trx-table--title
    font-size: 22.75px
    font-style: normal
    font-weight: 400
    line-height: 27px

.trx-table--main-container
    width: 90%

.trx-table--filter-buttons
    gap: 10px 0px

.block-table--fixed-layout
    .q-table
        table-layout: fixed

        tbody td
            height: 3.25rem
            vertical-align: items-center

        tbody td:first-child
            word-break: break-all


.q-table--no-wrap td
    word-break: break-all
    white-space: unset

.q-table td div
    overflow-y: clip
    transition: max-height 0.5s cubic-bezier(0, 1, 0, 1)

    &.row-expanded
        max-height: 1000px
        transition: max-height 2s ease-out

.expand-icon
    padding-left: 2rem
    cursor: pointer

.table-container
    overflow-x: auto

.table-header
    color: #000000 !important
    opacity: 0.5

.hover-dec
    text-decoration: none

    &:hover
        text-decoration: underline

.dropdown-filter
    max-width: 300px

.expanded-row
    background: var(--q-color-producer-card-background)

.q-btn.q-btn--no-text-transform
    text-transform: none

@media screen and (max-width: $medium)
    .trx-table--topright-col
        justify-content: end
    .trx-table--topleft-col, .trx-table--topright-col
        display: flex
        padding-left: 16px
        padding-right: 16px
        min-width: 100% !important
    .trx-table--main-container
        width: 100%
    .trx-table--fixed-layout
        min-width: 620px

        .q-table
            table-layout: auto

            tbody td:first-child
                word-break: break-all

            th:nth-child(1)
                width: 12%

            th:nth-child(2)
                width: 17%

            th:nth-child(3)
                width: 17%

            th:nth-child(4)
                width: 54%

@media screen and (max-width: 665px)
    .trx-table--topleft-col, .trx-table--topright-col
        display: block

</style>
