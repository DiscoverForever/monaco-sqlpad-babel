import MonacoSqlpad from './app';

/* istanbul ignore next */
MonacoSqlpad.install = function(Vue) {
  Vue.component(MonacoSqlpad.name, MonacoSqlpad);
};

export default MonacoSqlpad;