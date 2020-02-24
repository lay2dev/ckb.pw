// This is just an example,
// so you can safely delete all default props below
import { MIN_FEE_RATE } from '../../services/ckb/core'

export default {
  title: 'CKB P Wallet',
  sub_title: 'a revolutionary wallet for ckb',
  tab_account: 'Account',
  tab_explore: 'Explore',

  btn_transfer: '转账',
  btn_receive: '收款',
  btn_deposit: '存入',
  btn_withdraw: '取出',
  btn_recycle: 'Recycle',
  btn_confirm: '确认',
  btn_cancel: '取消',
  btn_change: 'Change',
  btn_clear: '清除',
  btn_send: '发送',
  btn_copy: '复制',
  btn_settings: '设置',
  btn_view_more: '查看更多',

  label_address: '地址',
  label_amount: '金额',
  label_remaining: '余额',
  label_fee: '手续费',
  label_fee_rate: '费率',
  label_min_amount: '最小金额',
  label_loading: '加载中..',
  label_tx_all: '总览',
  label_tx_in: '收入',
  label_tx_out: '支出',
  label_from: 'From',
  label_to: 'To',
  label_return: '返回主页',
  label_send_more: '再次发送',
  label_apc: '年化',
  label_locked: '锁定',
  label_in_dao: 'in DAO',
  label_revenue: '收益',
  label_advanced: 'Advanced',
  label_cheap: '慢',
  label_fast: '快',
  label_recent_tx: '近期收支',
  label_dapps: 'Dapps',
  label_no_record: '没有记录',
  label_withdrawing: '收款中',

  hint_address: '支持 ETH 和 CKB 地址',
  hint_amount: '最小转账金额为',
  hint_available: '当前可用',
  hint_dao_deposit: '存入 Nervos DAO',

  msg_dao_min_amount: '最少存入金额 102 CKB',
  msg_sent_success: '交易已发送',
  msg_field_required: '必填',
  msg_invalid_address: '无效地址',
  msg_min_fee_rate: `最低费率为 ${MIN_FEE_RATE} Shannons / KB`,
  msg_only_integer: `金额必须为整数`,
  msg_broke: `余额不足`,
  msg_confirm_delete: '确认删除 ?',
  msg_copy_success: '已复制 !'
}
