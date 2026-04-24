// TODO: Non-overlapping variable and literal checking. Likely extract var+lit list into a component
import { render } from 'preact';

import { Term } from './components/Term';
import './style.css';
import { useState } from 'preact/hooks';
import { systemSyntaxData } from './signals';

import type * as T from '../../formats/codegen/ts/types.d.ts';
import { useSignal } from '@preact/signals';
import { IdentifierMap } from './components/IdentifierMap';

export function App() {

	return (
		<div>
			<h1>Justify testin'</h1>
			<section style={{ display: 'flex', flexDirection: 'column' }}>
				<TermChooser />
			</section>
		</div>
	);
}

function TermChooser() {
	const [synCat, setSynCat] = useState<T.Identifier>('term');
	const [hasDuplicateVars, setHasDuplicateVars] = useState(false);
	const [hasDuplicateLits, setHasDuplicateLits] = useState(false);
	const variables = useSignal<Record<string, string>>({ x: 'x', y: 'y' });
	const literals = useSignal<Record<string, string>>({ nabla: '\\nabla' });
	return (
		<>
			<IdentifierMap
				title='Variables'
				identifiers={variables.value}
				onInput={newIdents => {
					variables.value = newIdents;
					setHasDuplicateVars(false);
				}}
				onDuplicateIdentifiers={() => setHasDuplicateVars(true)}
			/>
			{hasDuplicateVars && <p>Duplicate variables found</p>}

			<IdentifierMap
				title='Literals'
				identifiers={literals.value}
				onInput={newIdents => {
					literals.value = newIdents;
					setHasDuplicateLits(false);
				}}
				onDuplicateIdentifiers={() => setHasDuplicateLits(true)}
			/>
			{hasDuplicateLits && <p>Duplicate literals found</p>}

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

render(<App />, document.getElementById('app') as HTMLDivElement);
