import { defineComponent, h } from 'vue';

export const Pulldown = defineComponent({
  name: 'Pulldown',
  props: {
    class: {
      type: String,
      default: ''
    }
  },
  setup(props, { attrs }) {
    return () => h(
      'svg',
      {
        viewBox: '0 0 20 20',
        
        class: `its-icon ${props.class}`,
        ...attrs
      },
      [
        h('path', {"d": "M5.54188 13.7667C4.23218 12.0654 5.44503 9.60111 7.5921 9.60111L22.4079 9.60111C24.555 9.60111 25.7678 12.0654 24.4581 13.7667L17.0502 23.3899C16.0145 24.7353 13.9855 24.7353 12.9498 23.3899L5.54188 13.7667Z", "fillRule": "evenodd"})
      ]
    );
  }
});
