import { defineComponent, h } from 'vue';

export const Macbook = defineComponent({
  name: 'Macbook',
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
        h('path', {"d": "M26.5815 21.2744V7.99772C26.5815 7.59464 26.2722 7.27905 25.8629 7.27905H4.14027C3.73094 7.27905 3.4216 7.59777 3.4216 7.99772V21.2712H1V21.9618C1.30934 22.4617 2.9779 22.7211 3.63721 22.7211H26.1816C26.844 22.7211 28.6907 22.4617 29 21.9618V21.2712H26.5815V21.2744ZM4.38087 8.23832H25.6223V21.2744H4.38087V8.23832Z", "fillRule": "evenodd"})
      ]
    );
  }
});
