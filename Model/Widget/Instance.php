<?php

declare(strict_types=1);

namespace MageSuite\WidgetNotificationModal\Model\Widget;

class Instance extends \Magento\Widget\Model\Widget\Instance
{
    public const SINGLE_CMS_PAGE_LAYOUT_HANDLE = 'cms_page_view_id_{{ID}}';
    public const KEY_SPECIFIED_CMS_PAGE = 'specified_cms_page';

    protected ?\Magento\Framework\Serialize\Serializer\Json $serializer;
    protected \Magento\Cms\Api\PageRepositoryInterface $pageRepository;

    public function __construct(
        \Magento\Framework\Model\Context $context,
        \Magento\Framework\Registry $registry,
        \Magento\Framework\Escaper $escaper,
        \Magento\Framework\View\FileSystem $viewFileSystem,
        \Magento\Framework\App\Cache\TypeListInterface $cacheTypeList,
        \Magento\Catalog\Model\Product\Type $productType,
        \Magento\Widget\Model\Config\Reader $reader,
        \Magento\Widget\Model\Widget $widgetModel,
        \Magento\Widget\Model\NamespaceResolver $namespaceResolver,
        \Magento\Framework\Math\Random $mathRandom,
        \Magento\Framework\Filesystem $filesystem,
        \Magento\Widget\Helper\Conditions $conditionsHelper,
        \Magento\Framework\Serialize\Serializer\Json $serializer,
        \Magento\Cms\Api\PageRepositoryInterface $pageRepository,
        \Magento\Framework\Model\ResourceModel\AbstractResource $resource = null,
        \Magento\Framework\Data\Collection\AbstractDb $resourceCollection = null,
        array $relatedCacheTypes = [],
        array $data = [],
        \Magento\Framework\View\Model\Layout\Update\ValidatorFactory $xmlValidatorFactory = null
    ) {
        parent::__construct(
            $context,
            $registry,
            $escaper,
            $viewFileSystem,
            $cacheTypeList,
            $productType,
            $reader,
            $widgetModel,
            $namespaceResolver,
            $mathRandom,
            $filesystem,
            $conditionsHelper,
            $resource,
            $resourceCollection,
            $relatedCacheTypes,
            $data,
            $serializer,
            $xmlValidatorFactory
        );

        $this->serializer = $serializer;
    }

    protected function _construct()
    {
        parent::_construct();

        $this->_specificEntitiesLayoutHandles[self::KEY_SPECIFIED_CMS_PAGE] = self::SINGLE_CMS_PAGE_LAYOUT_HANDLE;
    }

    /**
     * Overridden in order to add support for parsing specified cms page layout handle (custom CMS pages).
     */
    public function beforeSave()
    {
        $pageGroupIds = [];
        $tmpPageGroups = [];
        $pageGroups = $this->getData('page_groups');
        if ($pageGroups) {
            foreach ($pageGroups as $pageGroup) {
                if (isset($pageGroup[$pageGroup['page_group']])) {
                    $pageGroupData = $pageGroup[$pageGroup['page_group']];
                    if ($pageGroupData['page_id']) {
                        $pageGroupIds[] = $pageGroupData['page_id'];
                    }
                    if (in_array($pageGroup['page_group'], ['pages', 'page_layouts'])) {
                        $layoutHandle = $pageGroupData['layout_handle'];
                    } elseif ($pageGroup['page_group'] === self::KEY_SPECIFIED_CMS_PAGE) {
                        $layoutHandle = str_replace(
                            '{{ID}}',
                            $pageGroupData['layout_handle'],
                            $this->_specificEntitiesLayoutHandles[$pageGroup['page_group']]
                        );
                    } else {
                        $layoutHandle = $this->_layoutHandles[$pageGroup['page_group']];
                    }
                    if (!isset($pageGroupData['template'])) {
                        $pageGroupData['template'] = '';
                    }
                    $tmpPageGroup = [
                        'page_id' => $pageGroupData['page_id'],
                        'group' => $pageGroup['page_group'],
                        'layout_handle' => $layoutHandle,
                        'for' => $pageGroupData['for'],
                        'block_reference' => $pageGroupData['block'],
                        'entities' => '',
                        'layout_handle_updates' => [$layoutHandle],
                        'template' => $pageGroupData['template'] ? $pageGroupData['template'] : '',
                    ];
                    if ($pageGroupData['for'] == self::SPECIFIC_ENTITIES) {
                        $layoutHandleUpdates = [];
                        foreach (explode(',', $pageGroupData['entities'] ?? '') as $entity) {
                            $layoutHandleUpdates[] = str_replace(
                                '{{ID}}',
                                $entity,
                                $this->_specificEntitiesLayoutHandles[$pageGroup['page_group']]
                            );
                        }
                        $tmpPageGroup['entities'] = $pageGroupData['entities'];
                        $tmpPageGroup['layout_handle_updates'] = $layoutHandleUpdates;
                    }
                    $tmpPageGroups[] = $tmpPageGroup;
                }
            }
        }
        if (is_array($this->getData('store_ids'))) {
            $this->setData('store_ids', implode(',', $this->getData('store_ids')));
        }
        $parameters = $this->getData('widget_parameters');
        if (is_array($parameters)) {
            if (array_key_exists('show_pager', $parameters) && !array_key_exists('page_var_name', $parameters)) {
                $parameters['page_var_name'] = 'p' . $this->mathRandom->getRandomString(
                    5,
                    \Magento\Framework\Math\Random::CHARS_LOWERS
                );
            }

            $this->setData('widget_parameters', $this->serializer->serialize($parameters));
        }
        $this->setData('page_groups', $tmpPageGroups);
        $this->setData('page_group_ids', $pageGroupIds);

        if (!$this->getId()) {
            $this->isObjectNew(true);
        }
        $this->_eventManager->dispatch('model_save_before', ['object' => $this]);
        $this->_eventManager->dispatch($this->_eventPrefix . '_save_before', $this->_getEventData());
    }
}
