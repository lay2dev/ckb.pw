// This is just an example,
// so you can safely delete all default props below
import { MIN_FEE_RATE } from '../../services/ckb/core'

export default {
  title: 'CKB P Wallet',
  sub_title: 'a revolutionary wallet for ckb',
  tab_account: 'Account',
  tab_explore: 'Explore',

  btn_transfer: 'Transfer',
  btn_receive: 'Receive',
  btn_deposit: 'Deposit',
  btn_withdraw: 'Withdraw',
  btn_recycle: 'Recycle',
  btn_confirm: 'Confirm',
  btn_cancel: 'Cancel',
  btn_change: 'Change',
  btn_clear: 'Clear',
  btn_send: 'Send',
  btn_copy: 'Copy',
  btn_settings: 'Settings',
  btn_view_more: 'View More',
  btn_fee_details: 'Fee Details',

  label_for: 'For',
  label_one_key_swap: 'One Key Swap',
  label_address: 'Address',
  label_amount: 'Amount',
  label_balance: 'Balance',
  label_remaining: 'Remaining',
  label_fee: 'Fee',
  label_fee_rate: 'Fee Rate',
  label_min_amount: 'Min amount',
  label_loading: 'Loading..',
  label_tx_all: 'All',
  label_tx_in: 'In',
  label_tx_out: 'Out',
  label_from: 'From',
  label_to: 'To',
  label_return: 'Return home',
  label_send_more: 'Send more',
  label_apc: 'APC',
  label_locked: 'Locked',
  label_in_dao: 'in DAO',
  label_revenue: 'Revenue',
  label_advanced: 'Advanced',
  label_cheap: 'Cheap',
  label_fast: 'Fast',
  label_recent_tx: 'Recent Transactions',
  label_dapps: 'Dapps',
  label_swap: 'Swap',
  label_no_record: 'No Record',
  label_withdrawing: 'Withdrawing',

  hint_address: 'ETH and CKB addresses are supported',
  hint_amount: 'Min transfer amount is ',
  hint_available: 'available',
  hint_dao_deposit: 'Deposit to Nervos DAO',

  msg_dao_min_amount: 'Min amount is 102 CKB',
  msg_sent_success: 'Transaction Sent',
  msg_field_required: 'Field is required',
  msg_invalid_address: 'Invalid Address',
  msg_min_fee_rate: `Min fee rate is ${MIN_FEE_RATE} Shannons / KB`,
  msg_only_integer: `Amount must be integer`,
  msg_broke: `Remaining can't be less than 61 CKB `,
  msg_confirm_delete: 'Proceed Deleting ?',
  msg_copy_success: 'Copied to Clipboard!',
  msg_no_more_cells:
    'No more live cells, please try again after the last transaction is confirmed.',
  msg_fee_details:
    'Fee rate is 0.5%, and we will perform exchanging on Huobi for you. The amount received may be less than expected if there is severe exchange rate fluctuations, please understand.'
}
