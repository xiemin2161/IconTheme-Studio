import { defineComponent, h } from 'vue';

export const Selected = defineComponent({
  name: 'Selected',
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
        h('path', {"d": "M15.0003 0C6.71582 0 0 6.71548 0 15.0001C0 23.2839 6.71582 30 15 30C23.2842 30 30 23.2839 30 15.0001C30 6.71548 23.2843 0 15.0003 0Z", "fillRule": "evenodd"}),
        h('path', {"d": "M7.29288 14.9597C7.68339 14.5692 8.31655 14.5692 8.70706 14.9597L12.6667 18.9192L21.2929 10.2929C21.6835 9.90237 22.3166 9.90237 22.7071 10.2929C23.0976 10.6834 23.0976 11.3165 22.7071 11.707L13.3736 21.0404C12.9832 21.431 12.35 21.431 11.9596 21.0404L7.29288 16.3737C6.90237 15.9833 6.90237 15.3502 7.29288 14.9597Z", "fillRule": "evenodd"})
      ]
    );
  }
});
