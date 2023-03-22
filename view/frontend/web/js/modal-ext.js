/**
 * Origin: Native M2 Modal Widget
 * Modification type: extend
 * Reasons:
 * - add modal-no-scroll class to body when modal is opened and calculate scroll position
 * - do not add additional above logic if minicart is opened
 */
 define(['jquery'], function ($) {
    'use strict';

    return function (mageModal) {
        $.widget('mage.modal', mageModal, {
            _createOverlay: function () {
                if (this.options.modalClass.includes('notification-modal') && !$('.minicart-offcanvas-open').length) {
                    const $currentTopOffset = window.scrollY;

                    $('body')
                        .addClass('modal-no-scroll')
                        .css({ top: -$currentTopOffset });    
                }

                this._super();
            },
            _destroyOverlay: function () {
                this._super();

                if (this.options.modalClass.includes('notification-modal') && !$('.minicart-offcanvas-open').length) {
                    const $currentTopOffset = $('body').css('top');

                    $('body').removeClass('modal-no-scroll').css({ top: '' });    
                    window.scrollTo(0, parseInt($currentTopOffset || '0', 10) * -1);
                }
            },
        });

        return $.mage.modal;
    };
});
