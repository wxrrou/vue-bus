import { createStore } from 'vuex';

export default createStore({
    state: {
        todoList: [],
        tab: 0,
    },
    getters: {
        todoList: (state) => state.todoList,
        tab: (state) => state.tab,
    },
    actions: {
        addTodo({ commit }, todoText) {
            commit("add_todo", todoText);
        },
        toggleTodo({ commit }, todo) {
            commit('edit_todo', { todo, done: !todo.done })

        },
        editTodo({ commit }, { todo, value }) {
            commit('edit_todo', { todo, title: value })
        },
        deleteTodo({ commit }, todo) {
            commit('delete_todo', todo)
        },
        setTab({ commit }, tab) {
            commit('set_tab', tab)
        }
    },
    mutations: {
        add_todo(state, todoText) {
            state.todoList.push({
                id: Date.now(),
                title: todoText,
                done: false,
            });
        },
        edit_todo(state, { todo, id = todo.id, title = todo.title, done = todo.done }) {
            const index = state.todoList.indexOf(todo)
            state.todoList.splice(index, 1, {
                ...todo,
                id,
                title,
                done
            })
        },
        delete_todo(state, todo) {
            const index = state.todoList.indexOf(todo)
            state.todoList.splice(index, 1)
        },
        set_tab(state, tab) {
            state.tab = tab;
        }
    },

    modules: {}
})