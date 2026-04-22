import { render } from 'preact';

import { Term } from './components/Term';
import './style.css';
import { useState } from 'preact/hooks';
import { systemSyntaxData } from './signals';

import type * as T from '../../../formats/codegen/ts/types.d.ts';
import { IdentifierMap } from './components/IdentifierMap';
import { useSignal } from '@preact/signals';

export function App() {

	return (
		<div>
			<h1>Justify testin'</h1>
			<section style={{display: 'flex', flexDirection: 'column'}}>
				<TermChooser />
			</section>
		</div>
	);
}

function TermChooser() {
	const [synCat, setSynCat] = useState<T.Identifier>('term');
	const variables = useSignal<Record<string, string>>({x: 'x', y: 'y'});
	const literals = useSignal<Record<string, string>>({nabla: '\\nabla'});
	return (
		<>
			<IdentifierMap signal={variables} title='Variables'/>
			<IdentifierMap signal={literals} title='Literals'/>
			<select onInput={ev => setSynCat(ev.currentTarget.value)}>
				{Object.keys(systemSyntaxData.value).map(sc => (
					<option>{sc}</option>
				))}
			</select>
			<Term
				synCat={synCat}
				variables={Object.keys(variables.value)}
				literals={Object.keys(literals.value)}
			/>
		</>
	);
}

render(<App />, document.getElementById('app'));
