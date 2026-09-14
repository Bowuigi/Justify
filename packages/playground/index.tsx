import { render } from 'preact';

import './app.css';

const vnode = <p>Hola</p>;

render(vnode, document.querySelector('#app')!);
