import * as React from 'react';
import { renderToString } from 'react-dom/server'
import { createApi } from './helpers';
import { asyncMethod, createFetcher, Fetcher } from '../index';
import * as Enzyme from 'enzyme';
import EnzymeAdapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new EnzymeAdapter() });

class Test extends React.Component<{ fetcher: Fetcher<string>}, {}> {
    render() {
        return React.createElement('div', {}, this.renderComponent());
    }
    @asyncMethod
    renderComponent() {
        const data = this.props.fetcher.get();
        return React.createElement('div', {}, data);
    }
    renderLoader() {
        return React.createElement('div', {}, 'loading');
    }
    renderError(err: Error) {
        return React.createElement('div', {}, err.message);
    }
}

it('render loading', () => {
    const api = createApi<string>();
    const fetcher = createFetcher(api.fetch);
    const component = renderToString(React.createElement(Test, { fetcher }))
    expect(component).toMatchSnapshot();
});

it('render error', async () => {
    const api = createApi<string>();
    const fetcher = createFetcher(api.fetch);
    api.reject(new Error('custom error'));
    try {
        fetcher.get();
        expect(false).toBeTruthy()
    } catch (e) {
        expect(true).toBeTruthy();
    }
    await api.defer.catch(_ => Promise.resolve());
    const component = renderToString(React.createElement(Test, { fetcher }))
    expect(component).toMatchSnapshot();
});

it('render data', async () => {
    const api = createApi<string>();
    const fetcher = createFetcher(api.fetch);
    const component = Enzyme.mount(React.createElement(Test, {fetcher: fetcher}));
    api.resolve('content');
    await api.defer;
    expect(component.html()).toMatchSnapshot();
});

it('render multiple components data', async () => {
    const api = createApi<string>();
    const fetcher = createFetcher(api.fetch);
    const components = [1, 2, 3].map(() => {
        return Enzyme.mount(React.createElement(Test, {fetcher}));
    });
    api.resolve('content');
    await api.defer;
    components.map((component) => {
        expect(component.html()).toMatchSnapshot();
    });
});
